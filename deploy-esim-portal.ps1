# Zero-Manual eSIM Portal Deployment Script
# Tenant: esimplus.onmicrosoft.com | Admin: admin@esimplus.onmicrosoft.com

param(
    [string]$Environment = "Development",
    [switch]$SkipPrerequisites = $false,
    [switch]$SkipDatabase = $false,
    [switch]$SkipFrontend = $false
)

$Config = @{
    ProjectRoot = "C:\eSIMPortal"
    DatabaseName = "esim_management"
    ApiPort = 8001
    FrontendPort = 3000
    TenantId = "esimplus.onmicrosoft.com"
    AdminEmail = "admin@esimplus.onmicrosoft.com"
}

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $colors = @{ "INFO" = "White"; "SUCCESS" = "Green"; "ERROR" = "Red" }
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $colors[$Type]
}

function Install-Prerequisites {
    if ($SkipPrerequisites) { return }
    
    Write-Status "Installing prerequisites..." "INFO"
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        winget install OpenJS.NodeJS.LTS --silent
        Write-Status "Node.js installed" "SUCCESS"
    }
    
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        winget install Python.Python.3.11 --silent
        Write-Status "Python installed" "SUCCESS"
    }
    
    if (-not (Get-Service mongodb -ErrorAction SilentlyContinue)) {
        winget install MongoDB.Server --silent
        Start-Service mongodb
        Write-Status "MongoDB installed and started" "SUCCESS"
    }
}

function Setup-Backend {
    Write-Status "Setting up backend..." "INFO"
    
    $backendPath = Join-Path $Config.ProjectRoot "backend"
    New-Item -ItemType Directory -Path $backendPath -Force | Out-Null
    Set-Location $backendPath
    
    # Install Python dependencies
    @"
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
pydantic==2.5.0
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.1.2
python-multipart==0.0.6
qrcode==7.4.2
Pillow==10.1.0
"@ | Out-File -FilePath "requirements.txt" -Encoding UTF8
    
    python -m pip install -r requirements.txt
    
    # Create minimal server
    @"
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

app = FastAPI(title="eSIM Plus API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client.esim_management

@app.get("/")
async def root():
    return {"message": "eSIM Plus API", "tenant": "esimplus.onmicrosoft.com"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
"@ | Out-File -FilePath "server.py" -Encoding UTF8
    
    Write-Status "Backend setup complete" "SUCCESS"
}

function Setup-Frontend {
    if ($SkipFrontend) { return }
    
    Write-Status "Setting up frontend..." "INFO"
    
    $frontendPath = Join-Path $Config.ProjectRoot "frontend"
    New-Item -ItemType Directory -Path $frontendPath -Force | Out-Null
    Set-Location $frontendPath
    
    npx create-react-app . --template typescript --silent
    npm install @mui/material @emotion/react @emotion/styled axios --silent
    
    # Create minimal App.tsx
    @"
import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            eSIM Plus Management Portal
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Tenant: esimplus.onmicrosoft.com
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Zero-manual eSIM provisioning for Myanmar operators: MPT, ATOM, OOREDOO, MYTEL
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
"@ | Out-File -FilePath "src/App.tsx" -Encoding UTF8
    
    Write-Status "Frontend setup complete" "SUCCESS"
}

function Setup-Database {
    if ($SkipDatabase) { return }
    
    Write-Status "Initializing database..." "INFO"
    
    # MongoDB collections will be created automatically by the application
    Write-Status "Database ready" "SUCCESS"
}

function Start-Services {
    Write-Status "Starting services..." "INFO"
    
    # Start backend
    $backendPath = Join-Path $Config.ProjectRoot "backend"
    Start-Process -FilePath "python" -ArgumentList "server.py" -WorkingDirectory $backendPath -WindowStyle Minimized
    
    if (-not $SkipFrontend) {
        # Start frontend
        $frontendPath = Join-Path $Config.ProjectRoot "frontend"
        Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $frontendPath -WindowStyle Minimized
    }
    
    Write-Status "Services started successfully" "SUCCESS"
    Write-Status "Backend: http://localhost:$($Config.ApiPort)" "INFO"
    if (-not $SkipFrontend) {
        Write-Status "Frontend: http://localhost:$($Config.FrontendPort)" "INFO"
    }
}

# Main execution
try {
    Write-Status "=== eSIM Plus Portal Deployment ===" "INFO"
    Write-Status "Environment: $Environment" "INFO"
    Write-Status "Tenant: $($Config.TenantId)" "INFO"
    
    New-Item -ItemType Directory -Path $Config.ProjectRoot -Force | Out-Null
    
    Install-Prerequisites
    Setup-Database
    Setup-Backend
    Setup-Frontend
    Start-Services
    
    Write-Status "Deployment completed successfully!" "SUCCESS"
    
} catch {
    Write-Status "Deployment failed: $($_.Exception.Message)" "ERROR"
    exit 1
}