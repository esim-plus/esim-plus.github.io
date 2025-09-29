# eSIM Profile Deactivation Module for Device Migration
# Tenant: esimplus.onmicrosoft.com

param(
    [Parameter(Mandatory=$true)][string]$ProfileId,
    [Parameter(Mandatory=$true)][string]$DeviceId,
    [Parameter(Mandatory=$false)][string]$TenantId = "esimplus.onmicrosoft.com"
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

function Remove-eSIMFromDevice {
    param([string]$ProfileId, [string]$DeviceId)
    
    try {
        # Find device configuration
        $configs = Get-MgDeviceManagementDeviceConfiguration | Where-Object { 
            $_.DisplayName -like "*$ProfileId*" 
        }
        
        if ($configs) {
            foreach ($config in $configs) {
                # Remove assignment for specific device
                $assignments = Get-MgDeviceManagementDeviceConfigurationAssignment -DeviceConfigurationId $config.Id
                
                foreach ($assignment in $assignments) {
                    if ($assignment.Target.DeviceId -eq $DeviceId) {
                        Remove-MgDeviceManagementDeviceConfigurationAssignment -DeviceConfigurationId $config.Id -DeviceConfigurationAssignmentId $assignment.Id
                    }
                }
            }
        }
        
        return @{
            Success = $true
            ProfileId = $ProfileId
            DeviceId = $DeviceId
            Message = "eSIM profile deactivated successfully"
        }
        
    } catch {
        return @{
            Success = $false
            ProfileId = $ProfileId
            DeviceId = $DeviceId
            Error = $_.Exception.Message
        }
    }
}

try {
    Connect-GraphTenant
    $result = Remove-eSIMFromDevice -ProfileId $ProfileId -DeviceId $DeviceId
    
    Write-Output ($result | ConvertTo-Json)
    
    if ($result.Success) {
        exit 0
    } else {
        exit 1
    }
} catch {
    @{
        Success = $false
        ProfileId = $ProfileId
        DeviceId = $DeviceId
        Error = $_.Exception.Message
        Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json | Write-Error
    
    exit 1
} finally {
    Disconnect-MgGraph -ErrorAction SilentlyContinue
}