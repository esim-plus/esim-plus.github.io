# PowerShell Script for eSIM Profile Deployment via Microsoft Graph API
# This script handles deployment of eSIM profiles to managed devices through Intune

param(
    [Parameter(Mandatory=$true)]
    [string]$ProfileId,
    
    [Parameter(Mandatory=$true)]
    [string]$DisplayName,
    
    [Parameter(Mandatory=$true)]
    [string]$ActivationCode,
    
    [Parameter(Mandatory=$true)]
    [string]$SmdpServerUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Provider,
    
    [Parameter(Mandatory=$false)]
    [string]$TargetDeviceId
)

# Import required modules
try {
    Import-Module Microsoft.Graph.Authentication -ErrorAction Stop
    Import-Module Microsoft.Graph.DeviceManagement -ErrorAction Stop
    Write-Output "Successfully imported Microsoft Graph modules"
} catch {
    Write-Error "Failed to import Microsoft Graph modules: $($_.Exception.Message)"
    exit 1
}

# Function to get access token
function Get-GraphAccessToken {
    try {
        # Get credentials from environment variables
        $clientId = $env:GRAPH_CLIENT_ID
        $clientSecret = $env:GRAPH_CLIENT_SECRET
        $tenantId = $env:GRAPH_TENANT_ID
        
        if (-not $clientId -or -not $clientSecret -or -not $tenantId) {
            throw "Missing Graph API credentials in environment variables"
        }
        
        # Connect to Microsoft Graph
        $secureSecret = ConvertTo-SecureString $clientSecret -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($clientId, $secureSecret)
        
        Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential -NoWelcome
        
        Write-Output "Successfully connected to Microsoft Graph"
        return $true
    } catch {
        Write-Error "Failed to connect to Microsoft Graph: $($_.Exception.Message)"
        return $false
    }
}

# Function to create eSIM configuration profile
function New-eSIMConfigurationProfile {
    param(
        [string]$Name,
        [string]$Description,
        [string]$ActivationCode,
        [string]$ServerUrl,
        [string]$Provider
    )
    
    try {
        # Create eSIM configuration
        $eSIMConfig = @{
            "@odata.type" = "#microsoft.graph.eSIMDeviceConfiguration"
            displayName = $Name
            description = $Description
            activationCodePoolId = $ActivationCode
            serverUrl = $ServerUrl
            provider = $Provider
        }
        
        # Create device configuration profile
        $profile = New-MgDeviceManagementDeviceConfiguration -BodyParameter $eSIMConfig
        
        Write-Output "Created eSIM configuration profile with ID: $($profile.Id)"
        return $profile
    } catch {
        Write-Error "Failed to create eSIM configuration profile: $($_.Exception.Message)"
        return $null
    }
}

# Function to assign profile to device or group
function Set-eSIMProfileAssignment {
    param(
        [string]$ProfileId,
        [string]$DeviceId
    )
    
    try {
        if ($DeviceId) {
            # Assign to specific device
            $assignment = @{
                target = @{
                    "@odata.type" = "#microsoft.graph.deviceAndAppManagementAssignmentTarget"
                    deviceId = $DeviceId
                }
            }
        } else {
            # Assign to all devices (default)
            $assignment = @{
                target = @{
                    "@odata.type" = "#microsoft.graph.allDevicesAssignmentTarget"
                }
            }
        }
        
        # Create assignment
        New-MgDeviceManagementDeviceConfigurationAssignment -DeviceConfigurationId $ProfileId -BodyParameter $assignment
        
        Write-Output "Successfully assigned eSIM profile to target"
        return $true
    } catch {
        Write-Error "Failed to assign eSIM profile: $($_.Exception.Message)"
        return $false
    }
}

# Function to check deployment status
function Get-eSIMDeploymentStatus {
    param(
        [string]$ProfileId
    )
    
    try {
        # Get device configuration status
        $status = Get-MgDeviceManagementDeviceConfigurationDeviceStatus -DeviceConfigurationId $ProfileId
        
        $deploymentStatus = @{
            TotalDevices = $status.Count
            Successful = ($status | Where-Object { $_.Status -eq "succeeded" }).Count
            Failed = ($status | Where-Object { $_.Status -eq "failed" }).Count
            Pending = ($status | Where-Object { $_.Status -eq "pending" }).Count
        }
        
        Write-Output "Deployment Status: Success: $($deploymentStatus.Successful), Failed: $($deploymentStatus.Failed), Pending: $($deploymentStatus.Pending)"
        return $deploymentStatus
    } catch {
        Write-Error "Failed to get deployment status: $($_.Exception.Message)"
        return $null
    }
}

# Main execution
try {
    Write-Output "Starting eSIM profile deployment for Profile ID: $ProfileId"
    Write-Output "Provider: $Provider, Display Name: $DisplayName"
    
    # Step 1: Authenticate with Microsoft Graph
    if (-not (Get-GraphAccessToken)) {
        throw "Failed to authenticate with Microsoft Graph"
    }
    
    # Step 2: Create eSIM configuration profile
    $description = "eSIM profile for $Provider - Created via eSIM Management System"
    $configProfile = New-eSIMConfigurationProfile -Name $DisplayName -Description $description -ActivationCode $ActivationCode -ServerUrl $SmdpServerUrl -Provider $Provider
    
    if (-not $configProfile) {
        throw "Failed to create eSIM configuration profile"
    }
    
    # Step 3: Assign profile to target
    if (-not (Set-eSIMProfileAssignment -ProfileId $configProfile.Id -DeviceId $TargetDeviceId)) {
        throw "Failed to assign eSIM profile"
    }
    
    # Step 4: Wait a moment and check initial status
    Start-Sleep -Seconds 5
    $deploymentStatus = Get-eSIMDeploymentStatus -ProfileId $configProfile.Id
    
    # Step 5: Output results
    $result = @{
        Success = $true
        ProfileId = $ProfileId
        GraphProfileId = $configProfile.Id
        DisplayName = $DisplayName
        Provider = $Provider
        DeploymentStatus = $deploymentStatus
        Message = "eSIM profile deployed successfully"
    }
    
    Write-Output "SUCCESS: eSIM profile deployment completed"
    Write-Output ($result | ConvertTo-Json -Depth 3)
    
    exit 0
    
} catch {
    $errorResult = @{
        Success = $false
        ProfileId = $ProfileId
        Error = $_.Exception.Message
        Message = "eSIM profile deployment failed"
    }
    
    Write-Error "FAILED: eSIM profile deployment failed"
    Write-Error ($errorResult | ConvertTo-Json -Depth 3)
    
    exit 1
} finally {
    # Disconnect from Microsoft Graph
    try {
        Disconnect-MgGraph -ErrorAction SilentlyContinue
    } catch {
        # Ignore disconnect errors
    }
}