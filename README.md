# eSIM Management Webapp

A complete, production-ready eSIM management system for ATOM, Ooredoo, Mytel, and MPT providers. Built with FastAPI backend, React frontend, and MongoDB database with PowerShell integration for Microsoft Intune deployment.

## 🚀 Features

### Frontend (React)
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **3D Animations**: GSAP-powered background animations
- **Profile Management**: Create, list, update, and deploy eSIM profiles
- **Real-time Status**: Live status updates and notifications
- **Provider Support**: ATOM, Ooredoo, Mytel, and MPT providers

### Backend (FastAPI)
- **REST API**: Complete CRUD operations for eSIM profiles
- **MongoDB Integration**: Scalable database with proper indexing
- **PowerShell Integration**: Microsoft Intune deployment automation
- **Logging System**: Comprehensive operation logging
- **Input Validation**: Robust data validation and error handling

### Database (MongoDB)
- **Profile Storage**: Complete eSIM profile data management
- **Operation Logs**: Detailed audit trail for all operations
- **Scalable Design**: Optimized for high performance

### PowerShell Integration
- **Intune Deployment**: Automated eSIM profile deployment via Graph API
- **Device Management**: Target specific devices or deploy to all
- **Status Tracking**: Real-time deployment status monitoring

## 🏗 Architecture

```
Frontend (React + Vite)     Backend (FastAPI)           Database (MongoDB)
├── Components              ├── REST API Endpoints      ├── esim_profiles
│   ├── Dashboard          │   ├── /api/esim/create    │   └── operation_logs
│   ├── CreateProfile      │   ├── /api/esim/list     └── PowerShell Scripts
│   ├── ListProfiles       │   ├── /api/esim/update       ├── Deploy-eSIMProfile.ps1
│   ├── UpdateProfile      │   ├── /api/esim/deploy       └── Test-GraphConnection.ps1
│   ├── DeployProfile      │   └── /api/esim/delete
│   └── ProfileLogs        └── MongoDB Operations
├── Services (API Client)
├── Utils (Helpers)
└── Styling (Tailwind)
```

## 📋 Prerequisites

- **Node.js** 18+ and Yarn
- **Python** 3.8+ with pip
- **MongoDB** (local or cloud instance)
- **PowerShell** 5.1+ or PowerShell Core 7+
- **Microsoft Graph PowerShell SDK**
- **Microsoft Intune Admin Access**

## 🛠 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd esim-management-webapp
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB and Graph API credentials
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env with your backend URL
```

### 4. Database Setup
```bash
# Start MongoDB (if running locally)
mongod

# Or use provided MongoDB Atlas connection string in .env
```

### 5. PowerShell Setup
```powershell
# Install Microsoft Graph PowerShell SDK
Install-Module Microsoft.Graph -Scope CurrentUser

# Test Graph API connection
cd scripts
.\Test-GraphConnection.ps1 -Verbose
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
GRAPH_CLIENT_ID=your_graph_client_id
GRAPH_CLIENT_SECRET=your_graph_client_secret
GRAPH_TENANT_ID=your_graph_tenant_id
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_VERSION=1.0.0
```

### Microsoft Graph API Setup
1. Register an app in Azure AD
2. Grant the following API permissions:
   - `DeviceManagementConfiguration.ReadWrite.All`
   - `DeviceManagementManagedDevices.Read.All`
3. Create a client secret
4. Add credentials to backend .env file

## 🚀 Running the Application

### Development Mode

#### Start Backend
```bash
cd backend
python server.py
# Backend runs on http://localhost:8001
```

#### Start Frontend
```bash
cd frontend
yarn dev
# Frontend runs on http://localhost:3000
```

### Production Mode

#### Build Frontend
```bash
cd frontend
yarn build
```

#### Start Backend (Production)
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001
```

## 📡 API Endpoints

### eSIM Profile Management
- `GET /api/health` - Health check
- `POST /api/esim/create` - Create new profile
- `GET /api/esim/list` - List all profiles
- `GET /api/esim/{profile_id}` - Get specific profile
- `PUT /api/esim/update/{profile_id}` - Update profile
- `POST /api/esim/deploy` - Deploy profile to Intune
- `DELETE /api/esim/{profile_id}` - Delete profile
- `GET /api/esim/logs/{profile_id}` - Get profile operation logs

### Request/Response Examples

#### Create Profile
```json
POST /api/esim/create
{
  "displayName": "Corporate eSIM - ATOM",
  "description": "eSIM profile for corporate devices",
  "activationCode": "LPA:1$smdp.example.com$...",
  "smdpServerUrl": "https://smdp.atom.com.mm",
  "provider": "ATOM"
}
```

#### Deploy Profile
```json
POST /api/esim/deploy
{
  "profileId": "profile-uuid",
  "targetDeviceId": "optional-device-id",
  "deploymentNotes": "Initial deployment"
}
```

## 🎨 UI Components

### Dashboard
- Profile statistics overview
- Quick action buttons
- Recent profiles list
- System health status

### Profile Management
- **Create**: Form for new profile creation
- **List**: Paginated table with search and filters
- **Update**: Edit existing profile details
- **Deploy**: Deploy profiles to Intune with options
- **Logs**: View operation history and deployment status

### Design System
- **Colors**: Primary blue (#2e70e5) with white accents
- **Typography**: Inter font family
- **Animations**: GSAP-powered floating elements
- **Responsive**: Mobile-first design approach

## 🔒 Security Features

- **Input Validation**: Comprehensive data validation
- **Environment Variables**: Secure credential management
- **CORS Configuration**: Proper cross-origin setup
- **Error Handling**: Graceful error management
- **Audit Logging**: Complete operation tracking

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
yarn test
```

### PowerShell Testing
```powershell
cd scripts
.\Test-GraphConnection.ps1 -Verbose
```

## 📊 Monitoring & Logging

- **Application Logs**: Structured logging with timestamps
- **Operation Logs**: Database-stored audit trail
- **Health Checks**: API endpoint monitoring
- **Error Tracking**: Comprehensive error reporting

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN yarn install
COPY frontend/ ./
RUN yarn build

FROM python:3.9-slim AS backend
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./static
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Cloud Deployment Options
- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Backend**: Heroku, DigitalOcean, or AWS
- **Database**: MongoDB Atlas
- **PowerShell**: Azure Automation or Functions

## 🛡 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check connection string format
mongodb+srv://username:password@cluster.mongodb.net/database

# Verify network access and credentials
```

#### Graph API Authentication Failed
```powershell
# Verify credentials in .env file
# Check Azure AD app permissions
# Test connection with Test-GraphConnection.ps1
```

#### PowerShell Execution Policy
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Logs Location
- **Backend**: `/var/log/esim_management.log`
- **Frontend**: Browser console
- **PowerShell**: Script output and Windows Event Log

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the troubleshooting section above

## 🎯 Roadmap

- [ ] Multi-tenant support
- [ ] Advanced deployment scheduling
- [ ] SMS/Email notifications
- [ ] Profile templates
- [ ] Bulk import/export
- [ ] Advanced analytics dashboard
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Automated testing suite
- [ ] Docker containerization

---

**Built with ❤️ for modern eSIM management**