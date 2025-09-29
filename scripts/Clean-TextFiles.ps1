# Text cleaning script to remove emojis and ensure English-only content
# Usage: .\Clean-TextFiles.ps1 -Path "C:\files" -Recursive

param(
    [Parameter(Mandatory=$true)][string]$Path,
    [switch]$Recursive = $false,
    [string[]]$Extensions = @("*.txt", "*.md", "*.json", "*.ps1", "*.py")
)

function Remove-Emojis {
    param([string]$Text)
    
    # Unicode ranges for emojis
    $emojiPattern = '[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2702}-\u{27B0}]|[\u{24C2}-\u{1F251}]'
    
    return $Text -replace $emojiPattern, ''
}

function Test-EnglishOnly {
    param([string]$Text)
    
    # Allow English letters, numbers, common punctuation, and whitespace
    $englishPattern = '^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=\[\]{}|\\:";\'<>?/~`]*$'
    
    return $Text -match $englishPattern
}

function Clean-TextFile {
    param([string]$FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $cleanedContent = Remove-Emojis -Text $content
        
        if ($content -ne $cleanedContent) {
            Set-Content -Path $FilePath -Value $cleanedContent -Encoding UTF8
            Write-Host "Cleaned: $FilePath" -ForegroundColor Green
            return $true
        }
        
        return $false
    } catch {
        Write-Warning "Failed to clean $FilePath`: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
$searchParams = @{
    Path = $Path
    Include = $Extensions
}

if ($Recursive) {
    $searchParams.Recurse = $true
}

$files = Get-ChildItem @searchParams -File
$cleanedCount = 0

foreach ($file in $files) {
    if (Clean-TextFile -FilePath $file.FullName) {
        $cleanedCount++
    }
}

Write-Host "Processed $($files.Count) files, cleaned $cleanedCount files" -ForegroundColor Cyan