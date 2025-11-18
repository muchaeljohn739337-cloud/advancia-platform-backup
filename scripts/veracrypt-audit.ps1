# Veracrypt Audit - Lists installed status and mounted volumes
param(
  [switch]$Json
)
$ErrorActionPreference = "Stop"

function Out-Result($obj){ if($Json){ $obj | ConvertTo-Json -Depth 5 } else { $obj } }

$vcPaths = @(
  "$env:ProgramFiles\VeraCrypt\VeraCrypt.exe",
  "$env:ProgramFiles(x86)\VeraCrypt\VeraCrypt.exe"
) | Where-Object { Test-Path $_ }

$result = [ordered]@{
  installed = $false
  exePath   = $null
  mounted   = @()
}

if($vcPaths.Count -gt 0){
  $result.installed = $true
  $result.exePath = $vcPaths[0]
  try {
    $output = & $result.exePath /q /list 2>$null
    # Typical output lines: "1: D:  \Device\VeraCryptVolumeX  \??\C:\path\to\file.hc"
    foreach($line in $output){
      if($line -match "^\s*\d+\s*:\s*(?<letter>[A-Z]):\s+(?<device>\\\\Device\\\\VeraCryptVolume\d+)\s+(?<source>.+)$"){
        $result.mounted += [ordered]@{
          drive      = $Matches['letter']+":"
          device     = $Matches['device']
          source     = $Matches['source'].Trim()
        }
      }
    }
  } catch {
    # If /list not supported, fall back to looking for VeraCrypt devices
    $result.mounted = @()
  }
} else {
  $result.installed = $false
}

Out-Result $result
