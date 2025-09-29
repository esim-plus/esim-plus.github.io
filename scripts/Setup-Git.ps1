# Git configuration setup for eSIM Plus project
# Tenant: esimplus.onmicrosoft.com

param(
    [string]$UserName = "eSIM Plus Admin",
    [string]$UserEmail = "admin@esimplus.onmicrosoft.com"
)

Write-Host "Configuring Git for eSIM Plus project..." -ForegroundColor Cyan

# Configure git user identity
git config user.name "$UserName"
git config user.email "$UserEmail"

# Configure git settings
git config core.autocrlf true
git config init.defaultBranch main
git config push.default simple

# Verify configuration
Write-Host "Git configuration:" -ForegroundColor Green
git config --list | Where-Object { $_ -match "user\.|core\.|init\.|push\." }

Write-Host "Git configured successfully for $UserName <$UserEmail>" -ForegroundColor Green