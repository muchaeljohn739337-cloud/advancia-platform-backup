# OPTIONAL: Windows Firewall Hardening for Local Dev Ports
# Run as Administrator if you choose to apply.
# Run: .\scripts\windows-hardening-optional.ps1

param(
  [switch]$Apply
)

$backendPort = 4000
$frontendPort = 3000

if (-not $Apply) {
  Write-Host "This script will block external inbound traffic to local dev ports (3000, 4000)." -ForegroundColor Yellow
  Write-Host "Run with -Apply to create firewall rules. Example: .\\scripts\\windows-hardening-optional.ps1 -Apply" -ForegroundColor Yellow
  exit 0
}

function Test-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

if (-not (Test-Admin)) { Write-Host "Run this script in an elevated PowerShell (Administrator)." -ForegroundColor Red; exit 1 }

Write-Host "Applying inbound firewall block for non-local addresses on ports 3000, 4000..." -ForegroundColor Cyan

# Block inbound from non-local addresses, allow loopback
New-NetFirewallRule -DisplayName "Advancia-Block-4000-External" -Direction Inbound -LocalPort $backendPort -Protocol TCP -Action Block -RemoteAddress Any -Profile Any -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "Advancia-Block-3000-External" -Direction Inbound -LocalPort $frontendPort -Protocol TCP -Action Block -RemoteAddress Any -Profile Any -ErrorAction SilentlyContinue | Out-Null

Write-Host "✅ Rules added. Localhost access remains, external inbound blocked." -ForegroundColor Green
