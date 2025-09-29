# eSIM Plus Management System Documentation

Welcome to the comprehensive documentation for the eSIM Plus Management System - an enterprise-grade zero-manual eSIM provisioning system for Myanmar telecom operators.

## Overview

The eSIM Plus Management System is designed for **MPT**, **ATOM**, **OOREDOO**, and **MYTEL** telecom operators, providing zero-manual eSIM provisioning with Microsoft Intune integration, multi-tenancy, RBAC enforcement, and comprehensive compliance logging.

## Key Features

- **Zero-Manual Provisioning**: Automated eSIM profile deployment via Microsoft Intune
- **Multi-Tenant Isolation**: Complete separation between telecom operators
- **Role-Based Access Control**: Admin, Operator, and Viewer roles with granular permissions
- **QR Code Lifecycle Management**: Automated QR code generation with expiration handling
- **Device Migration Workflows**: Seamless profile migration between devices
- **Compliance & Audit Logging**: Enterprise-grade audit trails for regulatory compliance
- **Myanmar Provider Support**: Dedicated support for MPT, ATOM, OOREDOO, MYTEL

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │   │   MongoDB       │
│   (Port 3000)   │◄──►│   (Port 8001)    │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  PowerShell     │
                       │  Scripts        │
                       │  (Intune API)   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Microsoft      │
                       │  Intune/Graph   │
                       │  API            │
                       └─────────────────┘
```

### Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Axios
- **Backend**: FastAPI, Python 3.11, PyMongo, Pydantic
- **Database**: MongoDB with optimized indexing
- **Authentication**: JWT with RBAC
- **Integration**: PowerShell + Microsoft Graph API
- **Deployment**: Supervisor process management

## Quick Start

### Prerequisites

- Node.js 18+ and Yarn
- Python 3.11+ with pip
- MongoDB (local or cloud)
- PowerShell 7+ or Windows PowerShell 5.1+
- Microsoft Graph PowerShell SDK
- Microsoft Intune Admin Access

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd esim-plus-management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Configure your MongoDB and Graph API credentials in .env
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   cp .env.example .env
   # Configure your backend URL in .env
   ```

4. **PowerShell Setup**
   ```powershell
   Install-Module Microsoft.Graph -Scope CurrentUser
   cd scripts
   .\Test-GraphConnection.ps1 -Verbose
   ```

### Running the Application

```bash
# Start all services
sudo supervisorctl start all

# Or start individually
sudo supervisorctl start backend
sudo supervisorctl start frontend
```

Access the application at `http://localhost:3000`

## Documentation Sections

### [API Reference](./api/README.md)
Complete REST API documentation with request/response examples

### [PowerShell Scripts](./powershell/README.md)
Detailed documentation for Microsoft Intune integration scripts

### [Frontend Guide](./frontend/README.md)
React components, state management, and UI/UX guidelines

### [Database Schema](./database/README.md)
MongoDB collections, indexes, and data models

### [Security & Compliance](./security/README.md)
RBAC, audit logging, and compliance requirements

### [Deployment Guide](./deployment/README.md)
Production deployment, scaling, and monitoring

### [Troubleshooting](./troubleshooting/README.md)
Common issues, solutions, and debugging guides

## Admin Identity Configuration

The system is configured for the provisioning identity:
- **Admin Identity**: `admin@esimplus.onmicrosoft.com`
- **Tenant**: `esimplus.onmicrosoft.com`

## Supported Myanmar Providers

| Provider | MCC | MNC | Status |
|----------|-----|-----|--------|
| MPT      | 414 | 01  | ✅ Active |
| ATOM     | 414 | 09  | ✅ Active |
| OOREDOO  | 414 | 05  | ✅ Active |
| MYTEL    | 414 | 06  | ✅ Active |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the [troubleshooting guide](./troubleshooting/README.md)

---

**Built for Myanmar eSIM ecosystem with enterprise-grade reliability and compliance**