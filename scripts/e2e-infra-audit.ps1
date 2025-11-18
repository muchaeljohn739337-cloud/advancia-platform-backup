# ============================================================================
# Advancia Pay - End-to-End Infra Audit (Droplet + Cloudflare + Vercel)
# ============================================================================
# Validates DNS, HTTPS, proxies, CORS, and service health across your stack.
# - No destructive changes; read-only tests by default
# - Optional API checks for Cloudflare, Vercel, DigitalOcean when tokens provided
#
# Usage examples:
#   .\scripts\e2e-infra-audit.ps1 -FrontendDomain app.example.com -ApiDomain api.example.com -DropletIp 203.0.113.10
#   $env:CLOUDFLARE_API_TOKEN='...' ; $env:CLOUDFLARE_ZONE_ID='...' ; .\scripts\e2e-infra-audit.ps1 -FrontendDomain ... -ApiDomain ...
# ============================================================================

param(
  [Parameter(Mandatory=$true)][string]$FrontendDomain,
  [Parameter(Mandatory=$true)][string]$ApiDomain,
  [string]$DropletIp = "",
  [string]$ExpectedCorsOrigin = "",
  [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Section($title){
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
  Write-Host $title -ForegroundColor Yellow
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
}

function HeaderDiagnostics($headers){
  $interesting = @('server','cf-ray','cf-cache-status','x-vercel-id','x-vercel-cache','strict-transport-security','content-security-policy','access-control-allow-origin')
  foreach($k in $interesting){ if($headers[$k]){ Write-Host ("  • {0}: {1}" -f $k, $headers[$k]) -ForegroundColor Gray } }
}

function IsCloudflareIp($ip){
  # Simplified CF IP CIDRs (not exhaustive)
  $prefixes = @(
    '173.245.48.0/20','103.21.244.0/22','103.22.200.0/22','103.31.4.0/22',
    '141.101.64.0/18','108.162.192.0/18','190.93.240.0/20','188.114.96.0/20',
    '197.234.240.0/22','198.41.128.0/17','162.158.0.0/15','104.16.0.0/12',
    '172.64.0.0/13','131.0.72.0/22'
  )
  foreach($cidr in $prefixes){
    if (Test-IpInCidr $ip $cidr) { return $true }
  }
  return $false
}

function Test-IpInCidr($ip, $cidr){
  $parts = $cidr.Split('/')
  $baseIp = $parts[0]
  $maskBits = [int]$parts[1]
  $ipBytes = [System.Net.IPAddress]::Parse($ip).GetAddressBytes()
  $baseBytes = [System.Net.IPAddress]::Parse($baseIp).GetAddressBytes()
  $mask = [uint32]0
  for ($i=0; $i -lt $maskBits; $i++){ $mask = $mask -bor (1 -shl (31 - $i)) }
  [array]::Reverse($ipBytes); [array]::Reverse($baseBytes)
  $ipInt = [BitConverter]::ToUInt32($ipBytes,0)
  $baseInt = [BitConverter]::ToUInt32($baseBytes,0)
  return (($ipInt -band $mask) -eq ($baseInt -band $mask))
}

function Resolve-ARecords($domain){
  try { (Resolve-DnsName -Name $domain -Type A -ErrorAction Stop).IPAddress } catch { @() }
}

function Test-Http($url, $method='GET', $headers=@{}){
  try{ return Invoke-WebRequest -Uri $url -Method $method -Headers $headers -MaximumRedirection 0 -TimeoutSec 10 -UseBasicParsing } catch { return $_.Exception.Response }
}

Section "Inputs"
Write-Host ("Frontend: {0}" -f $FrontendDomain) -ForegroundColor Cyan
Write-Host ("API:      {0}" -f $ApiDomain) -ForegroundColor Cyan
if ($DropletIp) { Write-Host ("Droplet IP: {0}" -f $DropletIp) -ForegroundColor Cyan }
if ($ExpectedCorsOrigin) { Write-Host ("Expected CORS Origin: {0}" -f $ExpectedCorsOrigin) -ForegroundColor Cyan }

# DNS Checks
Section "DNS"
$frontA = Resolve-ARecords $FrontendDomain
$apiA = Resolve-ARecords $ApiDomain
Write-Host ("{0} A -> {1}" -f $FrontendDomain, ($frontA -join ', ')) -ForegroundColor Green
Write-Host ("{0} A -> {1}" -f $ApiDomain, ($apiA -join ', ')) -ForegroundColor Green
if ($frontA.Count -eq 0 -or $apiA.Count -eq 0) { Write-Host "❌ Missing A records" -ForegroundColor Red }

# Cloudflare proxy heuristic
Section "Cloudflare Proxy Detection"
$frontCF = $false; foreach($ip in $frontA){ if (IsCloudflareIp $ip) { $frontCF=$true; break } }
$apiCF = $false; foreach($ip in $apiA){ if (IsCloudflareIp $ip) { $apiCF=$true; break } }
Write-Host ("{0} proxied by Cloudflare: {1}" -f $FrontendDomain, $frontCF) -ForegroundColor Green
Write-Host ("{0} proxied by Cloudflare: {1}" -f $ApiDomain, $apiCF) -ForegroundColor Green

# TLS/HTTPS and redirect
Section "HTTPS + Redirect"
$httpFront = Test-Http ("http://" + $FrontendDomain)
$httpsFront = Test-Http ("https://" + $FrontendDomain)
$httpApi = Test-Http ("http://" + $ApiDomain)
$httpsApi = Test-Http ("https://" + $ApiDomain)

if ($httpFront -and $httpFront.StatusCode -in 301,302,307,308 -and $httpFront.Headers['Location'] -match '^https://'){
  Write-Host "Frontend HTTP redirects to HTTPS: OK" -ForegroundColor Green
} else { Write-Host "Frontend HTTP->HTTPS redirect: CHECK" -ForegroundColor Yellow }
if ($httpApi -and $httpApi.StatusCode -in 301,302,307,308 -and $httpApi.Headers['Location'] -match '^https://'){
  Write-Host "API HTTP redirects to HTTPS: OK" -ForegroundColor Green
} else { Write-Host "API HTTP->HTTPS redirect: CHECK" -ForegroundColor Yellow }

if ($httpsFront) { Write-Host ("HTTPS Frontend status: {0}" -f $httpsFront.StatusCode) -ForegroundColor Green; HeaderDiagnostics $httpsFront.Headers }
if ($httpsApi) { Write-Host ("HTTPS API status: {0}" -f $httpsApi.StatusCode) -ForegroundColor Green; HeaderDiagnostics $httpsApi.Headers }

# Cloudflare/Vercel header surface check
Section "Edge Headers"
if ($httpsFront){
  if ($httpsFront.Headers['x-vercel-id']){ Write-Host "Vercel detected on frontend (x-vercel-id)" -ForegroundColor Green } else { Write-Host "No Vercel headers detected" -ForegroundColor Yellow }
  if ($httpsFront.Headers['cf-ray']){ Write-Host "Cloudflare detected on frontend (cf-ray)" -ForegroundColor Green }
}
if ($httpsApi){ if ($httpsApi.Headers['cf-ray']){ Write-Host "Cloudflare detected on API (cf-ray)" -ForegroundColor Green } }

# CORS preflight against API
Section "CORS Preflight"
if (-not $ExpectedCorsOrigin) { $ExpectedCorsOrigin = "https://$FrontendDomain" }
try {
  $pre = Test-Http ("https://" + $ApiDomain + "/api/health") 'OPTIONS' @{ Origin = $ExpectedCorsOrigin; 'Access-Control-Request-Method'='GET' }
  $allowed = $pre.Headers['access-control-allow-origin']
  if ($allowed -and ($allowed -eq $ExpectedCorsOrigin -or $allowed -eq '*')){
    Write-Host ("CORS allow-origin OK: {0}" -f $allowed) -ForegroundColor Green
  } else {
    Write-Host ("CORS allow-origin not matching. Received: {0}" -f $allowed) -ForegroundColor Yellow
  }
} catch { Write-Host "CORS preflight request failed" -ForegroundColor Red }

# API health
Section "API Health"
try {
  $health = Invoke-RestMethod -Uri ("https://" + $ApiDomain + "/api/health") -TimeoutSec 10
  if ($health.status -and $health.status -match 'ok'){ Write-Host "API /api/health OK" -ForegroundColor Green } else { Write-Host "API /api/health returned unexpected payload" -ForegroundColor Yellow }
} catch { Write-Host "API /api/health failed over HTTPS" -ForegroundColor Red }

# DigitalOcean droplet checks (optional)
if ($DropletIp) {
  Section "DigitalOcean Droplet Network"
  try { $tcp443 = Test-NetConnection -ComputerName $DropletIp -Port 443 -WarningAction SilentlyContinue; Write-Host ("443 open: {0}" -f $tcp443.TcpTestSucceeded) -ForegroundColor Green } catch {}
  try { $tcp80 = Test-NetConnection -ComputerName $DropletIp -Port 80 -WarningAction SilentlyContinue; Write-Host ("80 open: {0}" -f $tcp80.TcpTestSucceeded) -ForegroundColor Green } catch {}
  try { $ssh = Test-NetConnection -ComputerName $DropletIp -Port 22 -WarningAction SilentlyContinue; Write-Host ("22 open: {0}" -f $ssh.TcpTestSucceeded) -ForegroundColor Green } catch {}
}

# Optional: Cloudflare API checks
if ($env:CLOUDFLARE_API_TOKEN -and $env:CLOUDFLARE_ZONE_ID) {
  Section "Cloudflare API"
  $cfHeaders = @{ Authorization = "Bearer " + $env:CLOUDFLARE_API_TOKEN; 'Content-Type'='application/json' }
  try {
    $zone = Invoke-RestMethod -Method Get -Headers $cfHeaders -Uri ("https://api.cloudflare.com/client/v4/zones/" + $env:CLOUDFLARE_ZONE_ID)
    if ($zone.success){ Write-Host ("Zone: {0}" -f $zone.result.name) -ForegroundColor Green }
    $ssl = Invoke-RestMethod -Method Get -Headers $cfHeaders -Uri ("https://api.cloudflare.com/client/v4/zones/" + $env:CLOUDFLARE_ZONE_ID + "/settings/ssl")
    if ($ssl.success){ Write-Host ("SSL mode: {0}" -f $ssl.result.value) -ForegroundColor Green }
  } catch { Write-Host "Cloudflare API queries failed" -ForegroundColor Yellow }
}

# Optional: Vercel API checks
if ($env:VERCEL_TOKEN -and $env:VERCEL_PROJECT) {
  Section "Vercel API"
  $vHeaders = @{ Authorization = "Bearer " + $env:VERCEL_TOKEN }
  try {
    $dep = Invoke-RestMethod -Method Get -Headers $vHeaders -Uri ("https://api.vercel.com/v6/deployments?app=" + $env:VERCEL_PROJECT + "&limit=1")
    $d = $dep.deployments[0]
    if ($d){ Write-Host ("Latest deployment: {0} ({1})" -f $d.uid, $d.state) -ForegroundColor Green }
  } catch { Write-Host "Vercel API queries failed" -ForegroundColor Yellow }
}

# Optional: DigitalOcean API checks
if ($env:DIGITALOCEAN_TOKEN) {
  Section "DigitalOcean API"
  $doHeaders = @{ Authorization = "Bearer " + $env:DIGITALOCEAN_TOKEN }
  try {
    $droplets = Invoke-RestMethod -Method Get -Headers $doHeaders -Uri "https://api.digitalocean.com/v2/droplets?page=1&per_page=50"
    $count = ($droplets.droplets | Measure-Object).Count
    Write-Host ("Droplets visible: {0}" -f $count) -ForegroundColor Green
  } catch { Write-Host "DigitalOcean API queries failed" -ForegroundColor Yellow }
}

Write-Host "`n✅ Infra audit completed. Review any yellow or red messages above." -ForegroundColor Green
