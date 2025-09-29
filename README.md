# Zero-Manual eSIM Provisioning System v3.0

Enterprise-grade eSIM management platform for Myanmar telecom operators with Microsoft Intune integration, multi-tenant isolation, regulatory compliance, and automated text validation.

## Quick Start

```powershell
# Clone and deploy
git clone https://github.com/esim-plus/provisioning-system.git
cd provisioning-system
.\deploy-esim-portal.ps1
```

## System Overview

### Supported Operators
- **MPT**: Myanmar Posts and Telecommunications
- **ATOM**: ATOM Myanmar
- **OOREDOO**: Ooredoo Myanmar  
- **MYTEL**: Mytel Myanmar

### Core Features
- Zero-manual eSIM provisioning
- Multi-tenant data isolation
- RBAC enforcement (Admin/Operator/Viewer)
- QR code lifecycle management
- Device migration workflows
- Compliance audit logging
- Microsoft Intune integration
- Automated text validation
- Emoji-free content enforcement
- GitHub Actions CI/CD
- Docker containerization

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│   FastAPI       │◄──►│   MongoDB       │
│   (Port 3000)   │    │   (Port 8001)   │    │   (Port 27017)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  PowerShell     │
                       │  Modules        │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Microsoft      │
                       │  Intune/Graph   │
                       └─────────────────┘
```

## Configuration

### Tenant Settings
- **Tenant ID**: esimplus.onmicrosoft.com
- **Admin Identity**: admin@esimplus.onmicrosoft.com
- **Environment**: Production/Development

### Provider Endpoints
- **MPT SMDP**: mptmyanmar.china-xinghan.com
- **ATOM SMDP**: atommyanmar.validspereachdpplus.com
- **OOREDOO SMDP**: ooredoommr.rsp.instant-connectivity.com
- **MYTEL SMDP**: consumer.rsp.world

## API Endpoints

### Core Operations
```http
POST /api/esim/provision
POST /api/esim/migrate  
GET  /api/esim/profiles/{tenant_id}
GET  /api/compliance/audit
```

### Provider Integration
```http
POST /api/providers/validate
GET  /api/providers/status
```

## PowerShell Modules

### Intune Deployment
```powershell
.\scripts\modules\Intune-Deployment.ps1 `
  -ProfileId "uuid" `
  -Provider "MPT" `
  -ActivationCode "LPA:1$server$code"
```

### Provider Validation
```powershell
.\scripts\providers\Myanmar-Providers.ps1 `
  -Provider "ATOM" `
  -Operation "validate" `
  -ActivationCode "code"
```

### Device Migration
```powershell
.\scripts\modules\Deactivate-eSIM.ps1 `
  -ProfileId "uuid" `
  -DeviceId "device-id"
```

## Multi-Tenancy

### Tenant Isolation
- Scoped data access by tenant ID
- Cross-tenant access prevention
- Isolated API endpoints

### RBAC Matrix
| Role     | Create | Read | Update | Delete | Deploy | Migrate | Audit |
|----------|--------|------|--------|--------|--------|---------|-------|
| Admin    | ✓      | ✓    | ✓      | ✓      | ✓      | ✓       | ✓     |
| Operator | ✓      | ✓    | ✓      | ✗      | ✓      | ✓       | ✓     |
| Viewer   | ✗      | ✓    | ✗      | ✗      | ✗      | ✗       | ✓     |

## Compliance

### Audit Trail
- All operations logged with user context
- Regulatory compliance tracking
- 7-year data retention policy
- Immutable audit records

### Security Features
- JWT-based authentication
- Role-based authorization
- Tenant data isolation
- Encrypted data transmission

## Deployment Options

### Development
```powershell
.\deploy-esim-portal.ps1 -Environment "Development"
```

### Production
```powershell
.\deploy-esim-portal.ps1 -Environment "Production" -SkipPrerequisites
```

### Docker
```bash
docker-compose up -d
```

## Monitoring

### Health Checks
- `/api/health` - System health
- Database connectivity
- Provider API status
- Intune connection

### Metrics
- Profile provisioning rate
- Migration success rate
- API response times
- Error rates by provider

## Documentation

- **Deployment Guide**: [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Documentation**: http://localhost:8001/docs
- **GitHub Pages**: https://esim-plus.github.io

## Support

### Troubleshooting
1. Check service status: `Get-Service mongodb,postgresql`
2. Verify Graph API credentials
3. Review audit logs for errors
4. Test provider connectivity

### Contact
- **Repository**: https://github.com/esim-plus/provisioning-system
- **Issues**: https://github.com/esim-plus/provisioning-system/issues
- **Documentation**: https://esim-plus.github.io

## License

Apache License 2.0 - Enterprise deployment ready

Built for Myanmar telecom operators with operational transparency and regulatory compliance.