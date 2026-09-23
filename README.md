# MediCycle

**MediCycle** is a full-stack medicine donation and redistribution platform. It helps donors submit safe, unused medicines; enables authorized pharmacists to verify and distribute them; and gives eligible recipients a transparent way to request available stock.

> **Project status:** Educational prototype / capstone project. Production use requires applicable pharmaceutical, privacy, healthcare, and data-protection approvals.

## Contents

- [What the platform does](#what-the-platform-does)
- [Roles and workflows](#roles-and-workflows)
- [Key capabilities](#key-capabilities)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Configuration](#configuration)
- [API documentation](#api-documentation)
- [Production deployment](#production-deployment)
- [Testing](#testing)
- [Security and data handling](#security-and-data-handling)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## What the platform does

MediCycle connects medicine donors, recipients, pharmacists, doctors, and administrators in a controlled workflow:

1. A donor submits medicine details, expiry information, quantity, and supporting images.
2. A pharmacist reviews the donation and either approves or rejects it.
3. Approved donations become available in the pooled inventory.
4. A recipient searches available medicines and submits a request, including prescription documentation where required.
5. A pharmacist approves an eligible request and generates a signed, descriptive QR artifact.
6. The QR code is scanned at dispensing time; the backend validates the token, request, medicine identity, expiry, and remaining quantity before completing the distribution.

The platform also includes doctor consultation requests, uploaded-document review for administrators, medicine-image verification, health-assistant support, notifications, reporting, and operational cleanup jobs.

## Roles and workflows

| Role | Main responsibilities |
| --- | --- |
| **Donor** | Register, submit medicine donations, upload supporting images, track verification status, and view donation history |
| **Recipient** | Browse available medicines, request quantities, upload prescriptions when needed, track request status, and book doctor consultations |
| **Pharmacist** | Review donations and prescriptions, manage inventory, approve requests, generate QR codes, scan QR codes, and complete dispensing |
| **Doctor** | Review consultation requests, confirm appointments, and manage consultation workflow |
| **Administrator** | Manage users, review pharmacist/doctor documents, monitor reports, inspect activity, and control platform operations |

## Key capabilities

- JWT authentication with refresh-token support and role-based access control
- Configurable CORS origins and externalized production configuration
- Medicine donation and prescription uploads with server-side validation
- Pharmacist verification workflow for donations and recipient requests
- Medicine inventory and distribution tracking
- QR generation and dispensing validation
- Automatic QR SVG download using the persisted filename format:
  `medicine-name-YYYY-MM-DD.svg`
- Medicine-image analysis pipeline with structured extraction, confidence, and mismatch warnings
- OpenAI-compatible LLM integration with a safe fallback when an external provider is unavailable
- Doctor appointment and consultation workflow
- Admin review of uploaded doctor and pharmacist verification documents
- Smart matching and administrative reporting features
- Scheduled cleanup of expired refresh tokens and JWT blacklist entries
- Responsive React interface with accessible labels, role-specific navigation, and theme support
- Docker Compose deployment with PostgreSQL, Spring Boot, and Nginx

## Architecture

```text
                         HTTPS
                           |
                 React + Vite frontend
                    (Nginx in production)
                           |
                    REST / JSON / multipart
                           |
                 Spring Boot backend API
                 /       |        \
              Security  Services  OpenAPI
                           |
                    Spring Data JPA
                           |
             PostgreSQL (production) / H2 (tests)
```

Uploaded documents and medicine images are stored in the configured upload directory. In the Docker deployment, uploads and PostgreSQL data are backed by named volumes.

## Technology stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React
- `qrcode.react`
- `html5-qrcode`

### Backend

- Java 21
- Spring Boot 3.5
- Spring MVC and WebFlux
- Spring Data JPA / Hibernate
- Spring Security
- JJWT
- Jakarta Validation
- SpringDoc OpenAPI
- Spring Mail
- Maven Wrapper

### Data and operations

- PostgreSQL 16 for production
- H2 for automated tests
- Docker Compose
- Nginx
- JUnit 5, Mockito, and Spring Security Test

## Repository layout

```text
.
├── backend/
│   ├── src/main/java/com/medicycle/
│   │   ├── config/          # CORS, security, scheduling, application config
│   │   ├── controller/      # REST endpoints
│   │   ├── dto/             # Request and response contracts
│   │   ├── entity/          # JPA entities
│   │   ├── repository/      # Spring Data repositories
│   │   ├── security/        # JWT filters and authentication helpers
│   │   └── service/         # Domain and integration logic
│   ├── src/main/resources/  # Safe templates and runtime resources
│   ├── src/test/             # Backend tests
│   ├── Dockerfile
│   ├── mvnw / mvnw.cmd
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared UI and layout components
│   │   ├── context/         # Authentication and application state
│   │   ├── pages/           # Role-specific pages
│   │   ├── services/         # Axios API client and service calls
│   │   └── App.jsx           # Route tree and role guards
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/
│   ├── DEPLOYMENT.md
│   ├── ai-image-verification.md
│   ├── qr-donation-workflow.md
│   ├── demo-walkthrough.md
│   └── MediCycle_End_to_End_Project_Report_Detailed.docx
├── docker-compose.yml
├── .env.production.example
└── .gitignore
```

## Prerequisites

For local development:

- Java Development Kit 21
- Node.js 18 or newer and npm
- Git
- PostgreSQL, or use the H2 test/development profile where applicable

For Docker deployment:

- Docker Engine
- Docker Compose plugin
- A Linux VPS or equivalent host
- A domain name and HTTPS termination strategy

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/adithya22115/major-project.git
cd major-project
```

### 2. Configure the backend

Copy the safe configuration template if present:

```bash
cp backend/src/main/resources/application.properties.example \
   backend/src/main/resources/application.properties
```

On Windows PowerShell:

```powershell
Copy-Item backend\src\main\resources\application.properties.example `
  backend\src\main\resources\application.properties
```

Set local database, JWT, CORS, upload, mail, and optional LLM values in the local properties file. Do not commit local secrets or populated `.env` files.

### 3. Install frontend dependencies

```bash
cd frontend
npm ci
cd ..
```

### 4. Start the backend

Linux/macOS:

```bash
cd backend
./mvnw spring-boot:run
```

Windows:

```powershell
Set-Location backend
.\mvnw.cmd spring-boot:run
```

The API normally starts on `http://localhost:8080`.

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

The Vite development server normally starts on `http://localhost:5173`.

## Configuration

The committed `.env.production.example` documents the production variables. Create a private `.env` file from it for Docker deployment:

```bash
cp .env.production.example .env
```

Important values include:

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL database credentials |
| `JWT_SECRET` | Long random signing secret |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | Access and refresh token lifetimes |
| `APP_BASE_URL` | Public application URL |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial administrator account |
| `SPRING_MAIL_*` | Optional email notification configuration |
| `LLM_API_*` | Optional health-assistant provider |
| `MEDICINE_ANALYSIS_API_*` | Optional medicine-image analysis provider |
| `HTTP_PORT` | Host port for the Nginx frontend container |

Keep the following out of Git:

- Populated `.env` files
- JWT, database, SMTP, and LLM secrets
- Local `application.properties`
- Uploaded documents and images
- Logs, build output, `node_modules`, and Maven target files

## API documentation

With the backend running, open:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

All protected endpoints require a valid bearer access token unless the endpoint is explicitly public. The API is organized around authentication, donations, medicine requests, inventory, verification, appointments, notifications, files, administration, and health assistance.

## Production deployment

The repository includes a Docker Compose stack containing:

- PostgreSQL 16
- Spring Boot backend
- Nginx-served React frontend
- Persistent database and upload volumes

Quick start:

```bash
cp .env.production.example .env
# Edit .env and replace every placeholder.
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f backend
```

The frontend container exposes port `8080` by default and proxies:

- `/api/` to the backend
- `/uploads/` to the backend
- all other routes to the React SPA

Put Caddy, host-level Nginx, or a cloud load balancer in front of port `8080` for HTTPS. Complete VPS, firewall, backup, update, and restore instructions are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Do not use `docker compose down -v` during routine maintenance; it deletes the database and upload volumes.

## Testing

### Backend tests

Linux/macOS:

```bash
cd backend
./mvnw test
```

Windows:

```powershell
Set-Location backend
.\mvnw.cmd test
```

### Frontend checks

```bash
cd frontend
npm run lint
npm run build
```

The completed project validation included backend automated tests, frontend production build validation, and browser walkthroughs for donor, recipient, pharmacist, doctor, and administrator workflows. The latest recorded backend run passed 137 tests with zero failures and zero errors.

For a repeatable manual walkthrough, see [`docs/demo-walkthrough.md`](docs/demo-walkthrough.md) and [`docs/phase2-walkthrough.md`](docs/phase2-walkthrough.md).

## Security and data handling

- Authorization is enforced in the backend; frontend role guards are not a security boundary.
- Uploaded files must be treated as sensitive healthcare-related data.
- Use HTTPS before accepting real user accounts or documents.
- Use strong, rotated secrets and restrict production CORS to known origins.
- Keep PostgreSQL private and expose only the application edge.
- Review retention, deletion, access logging, and regulatory obligations before real deployment.
- AI extraction is assistive only. Users and authorized staff must review extracted medicine fields before submission or dispensing.
- QR validation is performed against current server-side state; a QR image alone does not authorize dispensing.

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): VPS, Docker, HTTPS, backups, and operations
- [`docs/ai-image-verification.md`](docs/ai-image-verification.md): medicine-image analysis pipeline
- [`docs/qr-donation-workflow.md`](docs/qr-donation-workflow.md): QR generation and dispensing workflow
- [`docs/demo-walkthrough.md`](docs/demo-walkthrough.md): end-to-end demo walkthrough
- [`docs/schema.txt`](docs/schema.txt): data model reference
- [`docs/MediCycle_End_to_End_Project_Report_Detailed.docx`](docs/MediCycle_End_to_End_Project_Report_Detailed.docx): extended project report

## Troubleshooting

### Port already in use

Stop the process using port 8080 or 5173, or configure another port. Always use the actual port printed by Spring Boot or Vite.

### CORS errors

Check `APP_CORS_ALLOWED_ORIGINS` or the corresponding backend property. Include the complete frontend origin, including its scheme and port, and restart the backend after changing it.

### Authentication failures

Confirm that the login response contains a valid access token, that the browser sends it as a bearer token, and that the JWT secret is stable across backend restarts.

### Upload failures

Check the configured upload directory, filesystem permissions, request-size limits, and supported file types. In Docker, confirm the upload volume is mounted and has free space.

### Database connection failures

Check PostgreSQL availability and credentials, then inspect:

```bash
docker compose logs --tail=200 db backend
```

## Contributing

1. Create a focused branch from `main`.
2. Keep changes scoped to one feature or fix.
3. Update directly related documentation.
4. Run backend tests and frontend lint/build checks.
5. Never commit secrets, generated uploads, logs, or build artifacts.
6. Describe validation steps in the pull request.

## License

No license file is currently included in the repository. Treat this project as **all rights reserved** unless a license is added by the project owner.
