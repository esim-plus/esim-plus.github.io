# Zero-Manual eSIM Deployment Module for Myanmar Operators
# Tenant: esimplus.onmicrosoft.com | Admin: admin@esimplus.onmicrosoft.com

param(
    [Parameter(Mandatory=$true)][string]$ProfileId,
    [Parameter(Mandatory=$true)][string]$TenantId,
    [Parameter(Mandatory=$true)][ValidateSet("MPT","ATOM","OOREDOO","MYTEL")][string]$Provider,
    [Parameter(Mandatory=$true)][string]$ActivationCode,
    [Parameter(Mandatory=$true)][string]$SmdpServerUrl,
    [Parameter(Mandatory=$false)][string]$TargetDeviceId
)

Import-Module Microsoft.Graph.Authentication, Microsoft.Graph.DeviceManagement -Force

function Connect-GraphTenant {
    $clientId = $env:GRAPH_CLIENT_ID
    $clientSecret = $env:GRAPH_CLIENT_SECRET
    $tenantId = "esimplus.onmicrosoft.com"
    
    $secureSecret = ConvertTo-SecureString $clientSecret -AsPlainText -Force
    $credential = New-Object PSCredential($clientId, $secureSecret)
    Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential -NoWelcome
}

function New-eSIMProfile {
    param([string]$Provider, [string]$ActivationCode, [string]$SmdpServerUrl)
    
    $config = @{
        "@odata.type" = "#microsoft.graph.eSIMDeviceConfiguration"
        displayName = "eSIM-$Provider-$(Get-Date -Format 'yyyyMMdd')"
        description = "Auto-deployed eSIM for $Provider via esimplus.onmicrosoft.com"
        activationCodePoolId = $ActivationCode
        serverUrl = $SmdpServerUrl
    }
    
    New-MgDeviceManagementDeviceConfiguration -BodyParameter $config
}

function Set-ProfileAssignment {
    param([string]$ConfigId, [string]$DeviceId)
    
    $target = if ($DeviceId) {
        @{ "@odata.type" = "microsoft.graph.deviceAndAppManagementAssignmentTarget"; deviceId = $DeviceId }
    } else {
        @{ "@odata.type" = "microsoft.graph.allDevicesAssignmentTarget" }
    }
    
    New-MgDeviceManagementDeviceConfigurationAssignment -DeviceConfigurationId $ConfigId -BodyParameter @{ target = $target }
}

try {
    Connect-GraphTenant
    $profile = New-eSIMProfile -Provider $Provider -ActivationCode $ActivationCode -SmdpServerUrl $SmdpServerUrl
    Set-ProfileAssignment -ConfigId $profile.Id -DeviceId $TargetDeviceId
    
    @{
        Success = $true
        ProfileId = $ProfileId
        GraphId = $profile.Id
        Provider = $Provider
        TenantId = $TenantId
        Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json
    
    exit 0
} catch {
    @{
        Success = $false
        ProfileId = $ProfileId
        Error = $_.Exception.Message
        Provider = $Provider
        TenantId = $TenantId
        Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json
    
    exit 1
} finally {
    Disconnect-MgGraph -ErrorAction SilentlyContinue
}