# MediCycle VPS deployment

This repository includes a Docker Compose deployment with PostgreSQL, the Spring Boot API, and an Nginx-served React frontend. The frontend container proxies `/api` and `/uploads` to the backend, so the browser uses one origin in production.

## 1. Prepare the VPS

Use a Linux VPS with at least 2 GB RAM, a domain name, and Docker Engine with the Compose plugin. Point the domain's DNS `A` record to the VPS public IP. Allow inbound TCP ports 22, 80, and 443, and keep PostgreSQL port 5432 private.

Install Docker using Docker's official instructions, then verify:

```bash
docker --version
docker compose version
```

## 2. Copy the application

Clone the repository on the VPS:

```bash
git clone <your-repository-url> medicycle
cd medicycle
cp .env.production.example .env
```

Edit `.env` and replace every placeholder. Generate strong secrets instead of inventing them:

```bash
openssl rand -base64 64
```

Set `APP_BASE_URL` and `APP_CORS_ALLOWED_ORIGINS` to the real HTTPS origin. Do not use `*` for CORS in production. Configure SMTP if verification, password reset, and appointment email notifications are required.

## 3. Start the stack

Build and start all services:

```bash
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f backend
```

Open `http://your-domain.example:8080` for the initial HTTP check. The initial admin account is seeded from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Change that password immediately after the first login.

## 4. Enable HTTPS

The included Nginx container serves HTTP and is ready to sit behind a TLS reverse proxy. The example maps it to host port 8080 so ports 80 and 443 remain available for Caddy. Install Caddy on the host and proxy the domain to port 8080:

```text
your-domain.example {
    reverse_proxy 127.0.0.1:8080
}
```

Alternatively, terminate TLS with a host-level Nginx or a cloud load balancer. After HTTPS is active, update `.env`:

```dotenv
APP_BASE_URL=https://your-domain.example
APP_CORS_ALLOWED_ORIGINS=https://your-domain.example
```

Then restart:

```bash
docker compose up -d
```

## 5. Backups and updates

The database and uploaded files are persistent Docker volumes. Back them up before upgrades:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backups/medicycle-$(date +%F).sql"
docker run --rm -v medicycle_uploads_data:/data -v "$PWD/backups:/backup" alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Update safely:

```bash
git pull
docker compose up -d --build
docker compose logs --tail=200 backend
```

Do not run `docker compose down -v` during normal maintenance; that removes the database and upload volumes.

## 6. Production checklist

- Use HTTPS before accepting real accounts or uploaded documents.
- Keep `.env`, database credentials, JWT secrets, SMTP passwords, and LLM keys outside Git.
- Restrict the VPS firewall to SSH, HTTP, and HTTPS.
- Use a unique database password and a long random JWT secret.
- Configure SMTP and verify email delivery.
- Confirm uploads and database backups can be restored.
- Monitor `docker compose logs` and disk usage.
- Replace `spring.jpa.hibernate.ddl-auto=update` with a migration process before frequent production schema changes.
- Rotate the seeded admin password and any exposed development credentials.
