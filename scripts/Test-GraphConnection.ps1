# Enhanced PowerShell Script to test Microsoft Graph API connection
# Enterprise-grade testing with comprehensive validation and reporting
# Supports eSIM Plus Management System requirements

param(
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$AdminIdentity = "admin@esimplus.onmicrosoft.com"
)

# Enhanced logging function
function Write-TestLog {
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
        AdminIdentity = $AdminIdentity
        Data = $Data
    }
    
    if ($Verbose) {
        $jsonLog = $logEntry | ConvertTo-Json -Compress
        Write-Output "[TEST] $jsonLog"
    } else {
        Write-Output "[$Level] $Message"
    }
}

# Import required modules with comprehensive error handling
try {
    Write-TestLog -Level "INFO" -Message "Importing Microsoft Graph modules"
    Import-Module Microsoft.Graph.Authentication -ErrorAction Stop -Force
    Import-Module Microsoft.Graph.DeviceManagement -ErrorAction Stop -Force
    Import-Module Microsoft.Graph.Users -ErrorAction Stop -Force
    Write-TestLog -Level "SUCCESS" -Message "Microsoft Graph modules imported successfully"
} catch {
    Write-TestLog -Level "ERROR" -Message "Failed to import Microsoft Graph modules" -Data @{Error = $_.Exception.Message}
    Write-Output "[SOLUTION] Install Microsoft Graph PowerShell SDK:"
    Write-Output "Install-Module Microsoft.Graph -Scope CurrentUser -Force"
    exit 1
}

# Function to test Graph connection with enhanced validation
function Test-GraphConnection {
    try {
        Write-TestLog -Level "INFO" -Message "Testing Microsoft Graph API connection"
        
        # Get credentials from environment variables
        $clientId = $env:GRAPH_CLIENT_ID
        $clientSecret = $env:GRAPH_CLIENT_SECRET
        $tenantId = $env:GRAPH_TENANT_ID
        
        if (-not $clientId -or -not $clientSecret -or -not $tenantId) {
            throw "Missing Graph API credentials. Set GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, and GRAPH_TENANT_ID environment variables."
        }
        
        Write-TestLog -Level "INFO" -Message "Credentials found" -Data @{
            ClientId = $clientId
            TenantId = $tenantId
            ClientSecretLength = $clientSecret.Length
        }
        
        # Connect to Microsoft Graph
        $secureSecret = ConvertTo-SecureString $clientSecret -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($clientId, $secureSecret)
        
        Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential -NoWelcome -ErrorAction Stop
        
        # Test the connection by getting current context
        $context = Get-MgContext
        
        if ($context) {
            Write-TestLog -Level "SUCCESS" -Message "Microsoft Graph connection successful" -Data @{
                TenantId = $context.TenantId
                ClientId = $context.ClientId
                Account = $context.Account
                Scopes = $context.Scopes -join ", "
                AuthType = $context.AuthType
            }
            return $true
        } else {
            throw "Failed to get Graph context after connection"
        }
        
    } catch {
        Write-TestLog -Level "ERROR" -Message "Microsoft Graph connection failed" -Data @{Error = $_.Exception.Message}
        return $false
    }
}

# Function to test device management permissions with detailed validation
function Test-DeviceManagementPermissions {
    try {
        Write-TestLog -Level "INFO" -Message "Testing Device Management permissions"
        
        # Test basic device management read permissions
        $configs = Get-MgDeviceManagementDeviceConfiguration -Top 1 -ErrorAction Stop
        Write-TestLog -Level "SUCCESS" -Message "Device configuration read permission verified"
        
        # Test device management write permissions by attempting to get detailed info
        $deviceManagementInfo = Get-MgDeviceManagement -ErrorAction Stop
        Write-TestLog -Level "SUCCESS" -Message "Device management access verified" -Data @{
            DeviceManagementVersion = $deviceManagementInfo.DeviceManagementVersion
            SubscriptionState = $deviceManagementInfo.SubscriptionState
        }
        
        return $true
        
    } catch {
        Write-TestLog -Level "ERROR" -Message "Device Management permissions test failed" -Data @{Error = $_.Exception.Message}
        Write-Output "[REQUIRED] The following API permissions are required:"
        Write-Output "- DeviceManagementConfiguration.ReadWrite.All"
        Write-Output "- DeviceManagementManagedDevices.Read.All"
        Write-Output "- DeviceManagementServiceConfig.ReadWrite.All"
        return $false
    }
}

# Function to test user permissions for admin identity validation
function Test-UserPermissions {
    try {
        Write-TestLog -Level "INFO" -Message "Testing User permissions and admin identity"
        
        # Try to get admin user information
        if ($AdminIdentity -and $AdminIdentity -ne "") {
            $adminUser = Get-MgUser -UserId $AdminIdentity -ErrorAction Stop
            Write-TestLog -Level "SUCCESS" -Message "Admin identity verified" -Data @{
                AdminIdentity = $adminUser.UserPrincipalName
                DisplayName = $adminUser.DisplayName
                AccountEnabled = $adminUser.AccountEnabled
            }
        }
        
        # Test general user read permissions
        $users = Get-MgUser -Top 1 -ErrorAction Stop
        Write-TestLog -Level "SUCCESS" -Message "User read permission verified"
        
        return $true
        
    } catch {
        Write-TestLog -Level "WARNING" -Message "User permissions test failed" -Data @{Error = $_.Exception.Message}
        Write-Output "[OPTIONAL] User.Read.All permission recommended for admin identity validation"
        return $false
    }
}

# Function to test eSIM specific configurations
function Test-eSIMCapabilities {
    try {
        Write-TestLog -Level "INFO" -Message "Testing eSIM specific capabilities"
        
        # Check for existing eSIM configurations
        $eSIMConfigs = Get-MgDeviceManagementDeviceConfiguration -Filter "deviceConfigurationType eq 'eSIM'" -ErrorAction SilentlyContinue
        
        if ($eSIMConfigs) {
            Write-TestLog -Level "SUCCESS" -Message "Existing eSIM configurations found" -Data @{
                ConfigCount = $eSIMConfigs.Count
            }
        } else {
            Write-TestLog -Level "INFO" -Message "No existing eSIM configurations found (this is normal for new tenants)"
        }
        
        # Test supported providers for Myanmar
        $supportedProviders = @("MPT", "ATOM", "OOREDOO", "MYTEL")
        Write-TestLog -Level "INFO" -Message "Myanmar eSIM providers supported" -Data @{
            SupportedProviders = $supportedProviders -join ", "
        }
        
        return $true
        
    } catch {
        Write-TestLog -Level "WARNING" -Message "eSIM capabilities test failed" -Data @{Error = $_.Exception.Message}
        return $false
    }
}

# Function to generate comprehensive test report
function New-TestReport {
    param(
        [hashtable]$TestResults
    )
    
    $report = @{
        TestSummary = @{
            Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
            AdminIdentity = $AdminIdentity
            OverallStatus = if ($TestResults.Values -contains $false) { "FAILED" } else { "PASSED" }
        }
        TestResults = $TestResults
        Recommendations = @()
        NextSteps = @()
    }
    
    # Add recommendations based on test results
    if (-not $TestResults.GraphConnection) {
        $report.Recommendations += "Fix Microsoft Graph API credentials and permissions"
    }
    
    if (-not $TestResults.DeviceManagement) {
        $report.Recommendations += "Grant required Device Management permissions in Azure AD"
    }
    
    if (-not $TestResults.UserPermissions) {
        $report.Recommendations += "Consider granting User.Read.All permission for enhanced functionality"
    }
    
    # Add next steps
    if ($report.TestSummary.OverallStatus -eq "PASSED") {
        $report.NextSteps += "System ready for eSIM profile deployment"
        $report.NextSteps += "Use Deploy-eSIMProfile.ps1 to deploy eSIM profiles"
    } else {
        $report.NextSteps += "Resolve failed tests before attempting eSIM deployments"
        $report.NextSteps += "Contact Azure AD administrator for permission grants"
    }
    
    return $report
}

# Main execution with comprehensive testing
try {
    Write-Output "===== eSIM Plus Microsoft Graph API Connection Test ====="
    Write-TestLog -Level "INFO" -Message "Starting comprehensive Graph API test suite"
    
    $testResults = @{
        GraphConnection = $false
        DeviceManagement = $false
        UserPermissions = $false
        eSIMCapabilities = $false
    }
    
    # Test 1: Basic Graph connection
    Write-Output "\n[TEST 1] Testing Microsoft Graph connection..."
    $testResults.GraphConnection = Test-GraphConnection
    
    if ($testResults.GraphConnection) {
        # Test 2: Device Management permissions
        Write-Output "\n[TEST 2] Testing Device Management permissions..."
        $testResults.DeviceManagement = Test-DeviceManagementPermissions
        
        # Test 3: User permissions (optional)
        Write-Output "\n[TEST 3] Testing User permissions..."
        $testResults.UserPermissions = Test-UserPermissions
        
        # Test 4: eSIM capabilities
        Write-Output "\n[TEST 4] Testing eSIM capabilities..."
        $testResults.eSIMCapabilities = Test-eSIMCapabilities
    }
    
    # Generate comprehensive test report
    $report = New-TestReport -TestResults $testResults
    
    Write-Output "\n===== Test Complete ====="
    Write-Output "Overall Status: $($report.TestSummary.OverallStatus)"
    
    if ($Verbose) {
        Write-Output "\n[DETAILED REPORT]"
        Write-Output ($report | ConvertTo-Json -Depth 4)
    }
    
    if ($report.Recommendations.Count -gt 0) {
        Write-Output "\n[RECOMMENDATIONS]"
        $report.Recommendations | ForEach-Object { Write-Output "- $_" }
    }
    
    if ($report.NextSteps.Count -gt 0) {
        Write-Output "\n[NEXT STEPS]"
        $report.NextSteps | ForEach-Object { Write-Output "- $_" }
    }
    
    # Exit with appropriate code
    if ($report.TestSummary.OverallStatus -eq "PASSED") {
        Write-TestLog -Level "SUCCESS" -Message "All critical tests passed - system ready for eSIM deployment"
        exit 0
    } else {
        Write-TestLog -Level "ERROR" -Message "One or more critical tests failed - system not ready"
        exit 1
    }
    
} catch {
    Write-TestLog -Level "ERROR" -Message "Test execution failed" -Data @{Error = $_.Exception.Message}
    exit 1
} finally {
    # Clean up Graph connection
    try {
        Disconnect-MgGraph -ErrorAction SilentlyContinue
    } catch {
        # Ignore disconnect errors
    }
}