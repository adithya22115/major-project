run dev# MediCycle - Smart Medicine Donation & Redistribution Platform

A full-stack web application designed to reduce medicine waste by enabling users to donate unused, unexpired medicines. Every donated medicine is verified by an authorized pharmacy or NGO before becoming available in a pooled inventory for eligible patients to request.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

MediCycle addresses the critical issue of medicine waste by creating a secure, transparent platform for medicine donation and redistribution. The system ensures that donated medicines are properly verified before being made available to patients in need, promoting healthcare equity and reducing environmental waste from improperly disposed medications.

## Features

### User Roles
- **Donor (Patient)**: Register, donate medicines, upload details/images, view donation status and history
- **Recipient (Patient)**: Search medicines, request medicines, upload prescriptions when required, track requests
- **Pharmacy/NGO**: Verify donations, manage pooled inventory, approve recipient requests, distribute medicines
- **Admin**: Manage users, medicines, reports, verification records, and platform settings

### Core Functionality
- Secure user authentication with JWT
- Medicine donation with image upload
- Prescription verification for restricted medications
- Pharmacist/NGO verification workflow
- Pooled inventory management
- Medicine request and fulfillment system
- Real-time notifications
- Role-based dashboards
- Audit trail for all activities
- Responsive design for mobile and desktop

## Technology Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Framework**: Spring Boot 3
- **ORM**: Spring Data JPA with Hibernate
- **Security**: Spring Security with JWT
- **Validation**: Jakarta Validation
- **Documentation**: SpringDoc OpenAPI (Swagger)
- **Logging**: SLF4J with Logback
- **Build Tool**: Maven

### Database
- **Development**: H2 in-memory database
- **Production**: PostgreSQL
- **Connection Pool**: HikariCP

### Additional Tools
- **File Upload**: Local storage (Cloudinary integration possible)
- **Testing**: JUnit 5, Mockito
- **Version Control**: Git

## System Architecture

MediCycle follows a classic three-tier architecture:

```
Frontend (React/Vite)  <-- HTTPS REST APIs -->  Backend (Spring Boot)  -->  Database (PostgreSQL/H2)
```

### Layers
1. **Presentation Layer**: React components handling UI and user interactions
2. **API Layer**: RESTful controllers handling HTTP requests/responses
3. **Service Layer**: Business logic implementation
4. **Persistence Layer**: JPA repositories handling database operations
5. **Database**: Relational database storing all application data

## Getting Started

### Prerequisites
- Java JDK 21 or higher
- Node.js 18+ and npm
- Git
- (For production) PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd majorProject
   ```

2. **Backend Setup**
   ```bash
   cd backend
   # No additional installation needed - Maven Wrapper included
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

#### Option 1: Development Mode (Recommended for development)

1. **Start the Backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   The backend will start on port 8080 (or 8081 if 8080 is in use)

2. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at http://localhost:5173 (or 5174/5175 if port in use)

#### Option 2: Production Build

1. **Build the Backend**
   ```bash
   cd backend
   ./mvnw clean package
   ```

2. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Run the Application**
   - Deploy the backend JAR to your Java runtime
   - Serve the frontend build files from a static web server
   - Configure CORS appropriately if frontend and backend are on different domains

### Accessing the Application

- **Frontend UI**: http://localhost:5173 (or alternative port if displayed in terminal)
- **Backend API**: http://localhost:8080/api (or 8081)
- **API Documentation (Swagger UI)**: http://localhost:8080/swagger-ui.html
- **Database Console (H2)**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:medicycle;DB_CLOSE_DELAY=-1;MODE=PostgreSQL`
  - Username: `sa`
  - Password: (leave blank)

## API Documentation

When the backend is running, you can access interactive API documentation through:

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

The API documentation provides detailed information about:
- All available endpoints
- Request/response formats
- Authentication requirements
- Example payloads
- Response codes

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/medicycle/
│   │   │       ├── config/           # Configuration classes
│   │   │       ├── controller/       # REST controllers
│   │   │       ├── dto/              # Data Transfer Objects
│   │   │       │   ├── request/      # Request DTOs
│   │   │       │   └── response/     # Response DTOs
│   │   │       ├── entity/           # JPA entities
│   │   │       ├── enums/            # Enumeration classes
│   │   │       ├── exception/        # Custom exceptions
│   │   │       ├── repository/       # Spring Data repositories
│   │   │       ├── security/         # Security configuration
│   │   │       ├── service/          # Business logic services
│   │   │       └── MediCycleApplication.java  # Main application class
│   │   └── resources/
│   │       ├── application.properties  # Configuration
│   │       └── data.sql              # Optional initial data
│   └── test/                     # Test classes
├── pom.xml                       # Maven configuration
└── HELP.md                       # Getting started guide
```

### Frontend Structure
```
frontend/
├── src/
│   ├── assets/           # Static assets (images, icons)
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── layout/       # Layout components (header, footer, sidebar)
│   ├── context/          # React Context providers
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages (login, register)
│   │   └── ...           # Other page components
│   ├── services/         # API service functions
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main application component
│   └── main.jsx          # Entry point
├── public/               # Static public files
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Environment Configuration

### Backend Configuration
Edit `backend/src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080

# Database Configuration (H2 for development)
spring.datasource.url=jdbc:h2:mem:medicycle;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# Hibernate Settings
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=YourSuperSecretKeyChangeInProductionMakeItLongEnough
jwt.expiration=86400000  # 24 hours in milliseconds

# File Upload Configuration
file.upload-dir=uploads
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB

# SpringDoc Configuration
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

### Frontend Configuration
The frontend automatically detects the backend API URL based on the window location. For production deployments where frontend and backend are on different domains, you may need to configure the API base URL in `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:8081/api',  // Adjust as needed
  // ... rest of configuration
});
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Backend will automatically try port 8081 if 8080 is occupied
   - Frontend will try ports 5174, 5175, etc. if 5173 is occupied
   - Check the terminal output for the actual ports being used

2. **Database Connection Issues**
   - For H2: Ensure no other application is using the same in-memory database
   - For PostgreSQL: Verify the database exists and credentials are correct
   - Check application logs for specific connection error messages

3. **CORS Errors**
   - Backend is configured to allow CORS requests
   - If issues persist, check `SecurityConfig.java` in the backend
   - Ensure frontend and backend are running on allowed origins

4. **Authentication Problems**
   - Verify that the JWT token is being stored in localStorage after login
   - Check that the token is being sent in the Authorization header
   - Ensure the token hasn't expired (default 24 hours)

5. **File Upload Issues**
   - Verify the `uploads/` directory exists in the backend working directory
   - Check file permissions for the upload directory
   - Ensure file types and sizes are within allowed limits

### Logs and Debugging

- **Backend Logs**: View console output where you started the backend with `./mvnw spring-boot:run`
- **Frontend Errors**: Check browser developer console for JavaScript errors
- **Network Requests**: Use browser dev tools Network tab to inspect API calls
- **Database Inspection**: Use H2 Console at `http://localhost:8080/h2-console`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Created as a capstone project for medicine waste reduction
- Built with modern full-stack technologies
- Designed with healthcare accessibility and equity in mind
- Inspired by real-world medicine donation programs

---

**Note**: This is an educational prototype. Actual deployment would require compliance with applicable pharmaceutical regulations and approvals from relevant health authorities.