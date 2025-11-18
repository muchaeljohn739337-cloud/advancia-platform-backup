<#
.SYNOPSIS
  Local Users & Access Audit
.DESCRIPTION
  Lists local users, admin group members, last logons, RDP events, installed remote access apps,
  open listening ports, firewall state. Outputs JSON report.
#>
[CmdletBinding()]
param(
  [string]$OutputPath = "C:\\audit-reports\\local-users-audit-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').json"
)
$ErrorActionPreference = 'SilentlyContinue'
$report = @{}

function Get-LocalAdmins {
  try { (Get-LocalGroupMember -Group 'Administrators' | Select-Object Name, ObjectClass, PrincipalSource) } catch { @() }
}
function Get-LocalUsers {
  try { Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordLastSet } catch { @() }
}
function Get-RDPSessions {
  try { qwinsta | Select-String -Pattern '^(?>\s*\S+\s+){3}\d+' | ForEach-Object { $_.Line } } catch { @() }
}
function Get-RecentLogons {
  try {
    $events = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624; StartTime=(Get-Date).AddDays(-7)} -MaxEvents 200
    $events | Select-Object TimeCreated, @{n='Account';e={$_.Properties[5].Value}}, @{n='IP';e={$_.Properties[18].Value}}
  } catch { @() }
}
function Get-RemoteAccessApps {
  $paths = @(
    "$env:ProgramFiles\TeamViewer\TeamViewer.exe",
    "$env:ProgramFiles(x86)\TeamViewer\TeamViewer.exe",
    "$env:ProgramFiles\AnyDesk\AnyDesk.exe",
    "$env:ProgramFiles(x86)\AnyDesk\AnyDesk.exe",
    "$env:ProgramFiles\Google\Chrome Remote Desktop\CurrentVersion\remoting_start_host.exe"
  )
  $apps = @()
  foreach ($p in $paths) { if (Test-Path $p) { $apps += (Get-Item $p | Select-Object Name, FullName, @{n='Version';e={$_.VersionInfo.FileVersion}}) } }
  $apps
}
function Get-ListeningPorts {
  try { netstat -ano | Select-String -Pattern 'LISTENING' | ForEach-Object { $_.Line } } catch { @() }
}
function Get-FirewallState {
  try { (Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction) } catch { @() }
}

$report.Host = @{ ComputerName=$env:COMPUTERNAME; User=$env:USERNAME; Timestamp=(Get-Date -Format 'o') }
$report.LocalUsers = Get-LocalUsers
$report.Administrators = Get-LocalAdmins
$report.RDPSessions = Get-RDPSessions
$report.RecentLogons = Get-RecentLogons
$report.RemoteAccessApps = Get-RemoteAccessApps
$report.Firewall = Get-FirewallState
$report.ListeningPorts = Get-ListeningPorts | Select-Object -First 100

$dir = Split-Path $OutputPath -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Saved report to $OutputPath"
