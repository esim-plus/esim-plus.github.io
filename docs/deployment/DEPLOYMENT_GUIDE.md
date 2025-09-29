# Zero-Manual eSIM Provisioning System Deployment Guide

## Quick Start

### Prerequisites
- Windows 10/11 or Windows Server 2019+
- PowerShell 5.1 or PowerShell Core 7+
- Administrator privileges
- Internet connectivity

### One-Command Deployment

```powershell
# Full deployment
.\deploy-esim-portal.ps1

# Skip prerequisites if already installed
.\deploy-esim-portal.ps1 -SkipPrerequisites

# Development deployment without frontend
.\deploy-esim-portal.ps1 -SkipFrontend

# Production deployment
.\deploy-esim-portal.ps1 -Environment "Production"
```

## System Architecture

### Core Components
- **Backend API**: FastAPI with MongoDB
- **Frontend Portal**: React with Material-UI
- **PowerShell Modules**: Intune integration scripts
- **Provider Adapters**: Myanmar operator integrations

### Tenant Configuration
- **Tenant ID**: esimplus.onmicrosoft.com
- **Admin Identity**: admin@esimplus.onmicrosoft.com
- **Supported Providers**: MPT, ATOM, OOREDOO, MYTEL

## Environment Variables

Create `.env` file in backend directory:

```env
MONGO_URL=mongodb://localhost:27017/esim_management
GRAPH_CLIENT_ID=your_client_id
GRAPH_CLIENT_SECRET=your_client_secret
GRAPH_TENANT_ID=esimplus.onmicrosoft.com
ADMIN_IDENTITY=admin@esimplus.onmicrosoft.com
JWT_SECRET_KEY=your_jwt_secret
```

## API Endpoints

### Core Operations
- `POST /api/esim/provision` - Zero-manual provisioning
- `POST /api/esim/migrate` - Device migration
- `GET /api/esim/profiles/{tenant_id}` - List profiles
- `GET /api/compliance/audit` - Audit logs

### Provider Integration
- `POST /api/providers/validate` - Validate activation codes
- `GET /api/providers/status` - Provider status check

## PowerShell Modules

### Intune Deployment
```powershell
.\scripts\modules\Intune-Deployment.ps1 -ProfileId "uuid" -Provider "MPT" -ActivationCode "code"
```

### Provider Validation
```powershell
.\scripts\providers\Myanmar-Providers.ps1 -Provider "ATOM" -Operation "validate" -ActivationCode "code"
```

## Multi-Tenant Isolation

### Tenant Scoping
- All operations scoped to tenant ID
- Cross-tenant access prevention
- Isolated data storage

### RBAC Enforcement
- **Admin**: Full system access
- **Operator**: Profile management
- **Viewer**: Read-only access

## Compliance and Auditing

### Audit Trail
- All operations logged with user context
- Regulatory compliance tracking
- Data retention policies

### Monitoring
- Health check endpoints
- Performance metrics
- Error tracking

## Production Deployment

### Security Hardening
1. Configure HTTPS certificates
2. Set up firewall rules
3. Enable audit logging
4. Configure backup procedures

### Scaling Considerations
- Database clustering for high availability
- Load balancing for API endpoints
- Containerization with Docker

## Troubleshooting

### Common Issues
- **MongoDB Connection**: Check service status and connection string
- **Graph API Auth**: Verify client credentials and permissions
- **PowerShell Execution**: Set execution policy if needed

### Log Locations
- Backend: `logs/esim_management.log`
- PowerShell: Windows Event Log
- Frontend: Browser console

## Support and Documentation

- **GitHub Repository**: https://github.com/esim-plus/provisioning-system
- **Documentation Site**: https://esim-plus.github.io
- **API Documentation**: http://localhost:8001/docs

## License

Apache License 2.0 - Enterprise deployment ready