# Enhanced PowerShell Script for eSIM Profile Deployment via Microsoft Graph API
# Enterprise-grade deployment with comprehensive logging and error handling
# Supports MPT, ATOM, OOREDOO, MYTEL providers

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
    [ValidateSet("MPT", "ATOM", "OOREDOO", "MYTEL")]
    [string]$Provider,
    
    [Parameter(Mandatory=$false)]
    [string]$TargetDeviceId,
    
    [Parameter(Mandatory=$false)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$false)]
    [string]$AdminIdentity = "admin@esimplus.onmicrosoft.com"
)

# Import required modules with error handling
try {
    Import-Module Microsoft.Graph.Authentication -ErrorAction Stop -Force
    Import-Module Microsoft.Graph.DeviceManagement -ErrorAction Stop -Force
    Import-Module Microsoft.Graph.DeviceManagement.Administration -ErrorAction Stop -Force
    Write-Output "[SUCCESS] Microsoft Graph modules imported successfully"
} catch {
    Write-Error "[CRITICAL] Failed to import Microsoft Graph modules: $($_.Exception.Message)"
    Write-Output "[INFO] Install required modules: Install-Module Microsoft.Graph -Scope CurrentUser"
    exit 1
}

# Enhanced logging function
function Write-AuditLog {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Level,
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [Parameter(Mandatory=$false)]
        [hashtable]$Data = @{}
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
    $logEntry = @{
        Timestamp = $timestamp
        Level = $Level
        Message = $Message
        ProfileId = $ProfileId
        Provider = $Provider
        AdminIdentity = $AdminIdentity
        Data = $Data
    }
    
    $jsonLog = $logEntry | ConvertTo-Json -Compress
    Write-Output "[AUDIT] $jsonLog"
}

# Function to get access token with enhanced error handling
function Get-GraphAccessToken {
    try {
        # Get credentials from environment variables
        $clientId = $env:GRAPH_CLIENT_ID
        $clientSecret = $env:GRAPH_CLIENT_SECRET
        $tenantId = $env:GRAPH_TENANT_ID
        
        if (-not $clientId -or -not $clientSecret -or -not $tenantId) {
            throw "Missing Graph API credentials. Set GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, and GRAPH_TENANT_ID environment variables."
        }
        
        Write-AuditLog -Level "INFO" -Message "Authenticating with Microsoft Graph" -Data @{ClientId = $clientId; TenantId = $tenantId}
        
        # Connect to Microsoft Graph with service principal
        $secureSecret = ConvertTo-SecureString $clientSecret -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($clientId, $secureSecret)
        
        Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential -NoWelcome -ErrorAction Stop
        
        # Verify connection
        $context = Get-MgContext
        if (-not $context) {
            throw "Failed to establish Graph context"
        }
        
        Write-AuditLog -Level "SUCCESS" -Message "Microsoft Graph authentication successful" -Data @{Account = $context.Account; Scopes = $context.Scopes}
        return $true
    } catch {
        Write-AuditLog -Level "ERROR" -Message "Microsoft Graph authentication failed" -Data @{Error = $_.Exception.Message}
        return $false
    }
}

# Function to create eSIM configuration profile with provider-specific settings
function New-eSIMConfigurationProfile {
    param(
        [string]$Name,
        [string]$Description,
        [string]$ActivationCode,
        [string]$ServerUrl,
        [string]$Provider
    )
    
    try {
        Write-AuditLog -Level "INFO" -Message "Creating eSIM configuration profile" -Data @{
            DisplayName = $Name
            Provider = $Provider
            ServerUrl = $ServerUrl
        }
        
        # Provider-specific configuration
        $providerConfig = switch ($Provider) {
            "MPT" {
                @{
                    "carrier" = "Myanmar Posts and Telecommunications"
                    "mcc" = "414"
                    "mnc" = "01"
                }
            }
            "ATOM" {
                @{
                    "carrier" = "ATOM"
                    "mcc" = "414"
                    "mnc" = "09"
                }
            }
            "OOREDOO" {
                @{
                    "carrier" = "Ooredoo Myanmar"
                    "mcc" = "414"
                    "mnc" = "05"
                }
            }
            "MYTEL" {
                @{
                    "carrier" = "Mytel"
                    "mcc" = "414"
                    "mnc" = "06"
                }
            }
            default {
                @{
                    "carrier" = $Provider
                    "mcc" = "414"
                    "mnc" = "99"
                }
            }
        }
        
        # Create enhanced eSIM configuration
        $eSIMConfig = @{
            "@odata.type" = "#microsoft.graph.eSIMDeviceConfiguration"
            displayName = $Name
            description = "$Description - Provider: $Provider - Created by eSIM Plus Management System"
            activationCodePoolId = $ActivationCode
            serverUrl = $ServerUrl
            carrierName = $providerConfig.carrier
            mobileCountryCode = $providerConfig.mcc
            mobileNetworkCode = $providerConfig.mnc
        }
        
        # Create device configuration profile
        $profile = New-MgDeviceManagementDeviceConfiguration -BodyParameter $eSIMConfig -ErrorAction Stop
        
        Write-AuditLog -Level "SUCCESS" -Message "eSIM configuration profile created successfully" -Data @{
            GraphProfileId = $profile.Id
            DisplayName = $profile.DisplayName
        }
        
        return $profile
    } catch {
        Write-AuditLog -Level "ERROR" -Message "Failed to create eSIM configuration profile" -Data @{
            Error = $_.Exception.Message
            ErrorDetails = $_.Exception.ToString()
        }
        return $null
    }
}

# Function to assign profile to device or group with enhanced targeting
function Set-eSIMProfileAssignment {
    param(
        [string]$ProfileId,
        [string]$DeviceId
    )
    
    try {
        Write-AuditLog -Level "INFO" -Message "Assigning eSIM profile" -Data @{
            GraphProfileId = $ProfileId
            TargetDevice = $DeviceId
        }
        
        if ($DeviceId) {
            # Assign to specific device
            $assignment = @{
                target = @{
                    "@odata.type" = "#microsoft.graph.deviceAndAppManagementAssignmentTarget"
                    deviceId = $DeviceId
                }
                intent = "required"
            }
            Write-AuditLog -Level "INFO" -Message "Targeting specific device" -Data @{DeviceId = $DeviceId}
        } else {
            # Assign to all devices in tenant
            $assignment = @{
                target = @{
                    "@odata.type" = "#microsoft.graph.allDevicesAssignmentTarget"
                }
                intent = "required"
            }
            Write-AuditLog -Level "INFO" -Message "Targeting all devices in tenant"
        }
        
        # Create assignment
        $result = New-MgDeviceManagementDeviceConfigurationAssignment -DeviceConfigurationId $ProfileId -BodyParameter $assignment -ErrorAction Stop
        
        Write-AuditLog -Level "SUCCESS" -Message "eSIM profile assignment created successfully" -Data @{
            AssignmentId = $result.Id
            TargetType = $assignment.target."@odata.type"
        }
        
        return $true
    } catch {
        Write-AuditLog -Level "ERROR" -Message "Failed to assign eSIM profile" -Data @{
            Error = $_.Exception.Message
            ErrorDetails = $_.Exception.ToString()
        }
        return $false
    }
}

# Function to check deployment status with detailed reporting
function Get-eSIMDeploymentStatus {
    param(
        [string]$ProfileId
    )
    
    try {
        Write-AuditLog -Level "INFO" -Message "Checking deployment status" -Data @{GraphProfileId = $ProfileId}
        
        # Get device configuration status
        $deviceStatuses = Get-MgDeviceManagementDeviceConfigurationDeviceStatus -DeviceConfigurationId $ProfileId -ErrorAction Stop
        
        $deploymentStatus = @{
            TotalDevices = $deviceStatuses.Count
            Successful = ($deviceStatuses | Where-Object { $_.Status -eq "compliant" }).Count
            Failed = ($deviceStatuses | Where-Object { $_.Status -eq "error" -or $_.Status -eq "conflict" }).Count
            Pending = ($deviceStatuses | Where-Object { $_.Status -eq "notApplicable" -or $_.Status -eq "unknown" }).Count
            InProgress = ($deviceStatuses | Where-Object { $_.Status -eq "remediated" }).Count
        }
        
        Write-AuditLog -Level "INFO" -Message "Deployment status retrieved" -Data $deploymentStatus
        
        return $deploymentStatus
    } catch {
        Write-AuditLog -Level "ERROR" -Message "Failed to get deployment status" -Data @{
            Error = $_.Exception.Message
        }
        return @{
            TotalDevices = 0
            Successful = 0
            Failed = 0
            Pending = 0
            InProgress = 0
            Error = $_.Exception.Message
        }
    }
}

# Enhanced validation function
function Test-DeploymentPrerequisites {
    try {
        Write-AuditLog -Level "INFO" -Message "Validating deployment prerequisites"
        
        # Validate activation code format
        if (-not $ActivationCode.StartsWith("LPA:")) {
            throw "Invalid activation code format. Must start with 'LPA:'"
        }
        
        # Validate SMDP server URL
        if (-not ([System.Uri]::IsWellFormedUriString($SmdpServerUrl, [System.UriKind]::Absolute))) {
            throw "Invalid SMDP server URL format"
        }
        
        # Validate provider
        if ($Provider -notin @("MPT", "ATOM", "OOREDOO", "MYTEL")) {
            throw "Invalid provider. Must be one of: MPT, ATOM, OOREDOO, MYTEL"
        }
        
        Write-AuditLog -Level "SUCCESS" -Message "Deployment prerequisites validated successfully"
        return $true
    } catch {
        Write-AuditLog -Level "ERROR" -Message "Deployment prerequisites validation failed" -Data @{
            Error = $_.Exception.Message
        }
        return $false
    }
}

# Main execution with comprehensive error handling and audit logging
try {
    Write-AuditLog -Level "INFO" -Message "eSIM deployment process started" -Data @{
        ProfileId = $ProfileId
        Provider = $Provider
        DisplayName = $DisplayName
        AdminIdentity = $AdminIdentity
    }
    
    # Step 1: Validate prerequisites
    if (-not (Test-DeploymentPrerequisites)) {
        throw "Prerequisites validation failed"
    }
    
    # Step 2: Authenticate with Microsoft Graph
    if (-not (Get-GraphAccessToken)) {
        throw "Microsoft Graph authentication failed"
    }
    
    # Step 3: Create eSIM configuration profile
    $description = "Enterprise eSIM profile for $Provider provider - Managed by eSIM Plus System"
    $configProfile = New-eSIMConfigurationProfile -Name $DisplayName -Description $description -ActivationCode $ActivationCode -ServerUrl $SmdpServerUrl -Provider $Provider
    
    if (-not $configProfile) {
        throw "Failed to create eSIM configuration profile"
    }
    
    # Step 4: Assign profile to target
    if (-not (Set-eSIMProfileAssignment -ProfileId $configProfile.Id -DeviceId $TargetDeviceId)) {
        throw "Failed to assign eSIM profile"
    }
    
    # Step 5: Wait and check initial deployment status
    Start-Sleep -Seconds 10
    $deploymentStatus = Get-eSIMDeploymentStatus -ProfileId $configProfile.Id
    
    # Step 6: Generate success result
    $result = @{
        Success = $true
        ProfileId = $ProfileId
        GraphProfileId = $configProfile.Id
        DisplayName = $DisplayName
        Provider = $Provider
        DeploymentStatus = $deploymentStatus
        Message = "eSIM profile deployed successfully to Microsoft Intune"
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
        AdminIdentity = $AdminIdentity
    }
    
    Write-AuditLog -Level "SUCCESS" -Message "eSIM deployment completed successfully" -Data $result
    Write-Output "SUCCESS: eSIM profile deployment completed"
    Write-Output ($result | ConvertTo-Json -Depth 4)
    
    exit 0
    
} catch {
    $errorResult = @{
        Success = $false
        ProfileId = $ProfileId
        Provider = $Provider
        Error = $_.Exception.Message
        ErrorDetails = $_.Exception.ToString()
        Message = "eSIM profile deployment failed"
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
        AdminIdentity = $AdminIdentity
    }
    
    Write-AuditLog -Level "ERROR" -Message "eSIM deployment failed" -Data $errorResult
    Write-Error "FAILED: eSIM profile deployment failed"
    Write-Error ($errorResult | ConvertTo-Json -Depth 4)
    
    exit 1
} finally {
    # Step 7: Clean up Graph connection
    try {
        Disconnect-MgGraph -ErrorAction SilentlyContinue
        Write-AuditLog -Level "INFO" -Message "Microsoft Graph connection closed"
    } catch {
        # Ignore disconnect errors
    }
}