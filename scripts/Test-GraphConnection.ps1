# PowerShell Script to test Microsoft Graph API connection
# Use this script to verify your Graph API credentials are configured correctly

param(
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Import required modules
try {
    Import-Module Microsoft.Graph.Authentication -ErrorAction Stop
    if ($Verbose) { Write-Output "Successfully imported Microsoft Graph Authentication module" }
} catch {
    Write-Error "Failed to import Microsoft Graph modules: $($_.Exception.Message)"
    Write-Output "Please install Microsoft Graph PowerShell SDK:"
    Write-Output "Install-Module Microsoft.Graph -Scope CurrentUser"
    exit 1
}

# Function to test Graph connection
function Test-GraphConnection {
    try {
        # Get credentials from environment variables
        $clientId = $env:GRAPH_CLIENT_ID
        $clientSecret = $env:GRAPH_CLIENT_SECRET
        $tenantId = $env:GRAPH_TENANT_ID
        
        if (-not $clientId -or -not $clientSecret -or -not $tenantId) {
            throw "Missing Graph API credentials in environment variables. Please set GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, and GRAPH_TENANT_ID"
        }
        
        if ($Verbose) {
            Write-Output "Client ID: $clientId"
            Write-Output "Tenant ID: $tenantId"
            Write-Output "Client Secret: [HIDDEN]"
        }
        
        # Connect to Microsoft Graph
        $secureSecret = ConvertTo-SecureString $clientSecret -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($clientId, $secureSecret)
        
        Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential -NoWelcome
        
        # Test the connection by getting current context
        $context = Get-MgContext
        
        if ($context) {
            Write-Output "SUCCESS: Connected to Microsoft Graph"
            Write-Output "Tenant ID: $($context.TenantId)"
            Write-Output "Client ID: $($context.ClientId)"
            Write-Output "Account: $($context.Account)"
            return $true
        } else {
            throw "Failed to get Graph context"
        }
        
    } catch {
        Write-Error "FAILED: Could not connect to Microsoft Graph: $($_.Exception.Message)"
        return $false
    }
}

# Function to test device management permissions
function Test-DeviceManagementPermissions {
    try {
        Import-Module Microsoft.Graph.DeviceManagement -ErrorAction Stop
        
        # Try to get device configurations (this requires DeviceManagementConfiguration.Read.All permission)
        $configs = Get-MgDeviceManagementDeviceConfiguration -Top 1 -ErrorAction Stop
        
        Write-Output "SUCCESS: Device Management permissions verified"
        return $true
        
    } catch {
        Write-Error "FAILED: Device Management permissions test failed: $($_.Exception.Message)"
        Write-Output "Required permissions: DeviceManagementConfiguration.ReadWrite.All"
        return $false
    }
}

# Main execution
try {
    Write-Output "=== Microsoft Graph API Connection Test ==="
    Write-Output "Testing connection to Microsoft Graph..."
    
    # Test basic connection
    if (Test-GraphConnection) {
        Write-Output ""
        Write-Output "Testing Device Management permissions..."
        Test-DeviceManagementPermissions
    }
    
    Write-Output ""
    Write-Output "=== Test Complete ==="
    
} catch {
    Write-Error "Test failed with error: $($_.Exception.Message)"
    exit 1
} finally {
    # Disconnect from Microsoft Graph
    try {
        Disconnect-MgGraph -ErrorAction SilentlyContinue
    } catch {
        # Ignore disconnect errors
    }
}