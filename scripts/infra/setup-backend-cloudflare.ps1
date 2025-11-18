<#!
.SYNOPSIS
  Automate exposing backend via Cloudflare (A record or Tunnel) + NGINX reverse proxy.
.DESCRIPTION
  Choose one mode: '-Mode ARecord' OR '-Mode Tunnel'. Do NOT mix both on same hostname.
.PARAMETER Domain advanciapayledger.com root domain in Cloudflare.
.PARAMETER Hostname Subdomain for API (e.g. api.advanciapayledger.com).
.PARAMETER DropletName Name filter for DigitalOcean droplet (doctl required) OR -DropletIp to skip lookup.
.PARAMETER DropletIp Public IPv4 of droplet if you already know it.
.PARAMETER Mode 'ARecord' or 'Tunnel'.
.PARAMETER InstallNginx Switch to install & configure NGINX reverse proxy.
.PARAMETER PrismaMigrate Run prisma migrate deploy after setup.
.EXAMPLE
  ./setup-backend-cloudflare.ps1 -Domain advanciapayledger.com -Hostname api.advanciapayledger.com -DropletName advancia-prod -Mode ARecord -InstallNginx -PrismaMigrate
#>
[CmdletBinding()] param(
  [Parameter(Mandatory=$true)] [string]$Domain,
  [Parameter(Mandatory=$true)] [string]$Hostname,
  [string]$DropletName,
  [string]$DropletIp,
  [ValidateSet('ARecord','Tunnel')] [string]$Mode = 'ARecord',
  [switch]$InstallNginx,
  [switch]$PrismaMigrate,
  [string]$BackendDir = '/opt/advancia/backend'
)
function Fail($m){ Write-Error $m; exit 1 }
Write-Host "=== Advancia Backend Exposure Setup ===" -ForegroundColor Cyan
if(-not $DropletIp){
  if(-not $DropletName){ Fail 'Provide -DropletName or -DropletIp' }
  Write-Host 'Resolving droplet IP via doctl...' -ForegroundColor Yellow
  $dropletLine = doctl compute droplet list --format Name,PublicIPv4 --no-header | Where-Object { $_ -match $DropletName }
  if(-not $dropletLine){ Fail "Droplet '$DropletName' not found" }
  $DropletIp = ($dropletLine -split '\s+')[1]
}
Write-Host "Droplet IP: $DropletIp" -ForegroundColor Green
$sub = $Hostname -replace "\.$Domain$",""
Write-Host "Subdomain part: $sub" -ForegroundColor DarkCyan
if($Mode -eq 'ARecord'){
  Write-Host "Creating / updating proxied A record (flarectl)..." -ForegroundColor Yellow
  try { flarectl dns create -zone $Domain -type A -name $sub -content $DropletIp -proxied true } catch { Write-Host 'Record may exist; attempting update' -ForegroundColor Yellow; flarectl dns edit -zone $Domain -type A -name $sub -content $DropletIp -proxied true }
  Write-Host "A record configured. Cloudflare SSL: set to Full (strict) after cert installed." -ForegroundColor Green
}
if($Mode -eq 'Tunnel'){
  Write-Host "Setting up Cloudflare Tunnel (cloudflared)..." -ForegroundColor Yellow
  cloudflared tunnel create advancia-backend 2>$null | Out-Null
  cloudflared tunnel route dns advancia-backend $Hostname
  Write-Host "Tunnel DNS route created." -ForegroundColor Green
  $cfg = @"
tunnel: advancia-backend
credentials-file: /root/.cloudflared/advancia-backend.json
ingress:
  - hostname: $Hostname
    service: http://127.0.0.1:4000
  - service: http_status:404
"@
  $cfg | ssh root@$DropletIp "cat > /root/.cloudflared/config.yml"
  ssh root@$DropletIp "systemctl enable cloudflared; systemctl restart cloudflared" 2>$null
  Write-Host "Tunnel service enabled." -ForegroundColor Green
}
if($InstallNginx){
  Write-Host 'Installing NGINX & configuring reverse proxy...' -ForegroundColor Yellow
  $nginxConf = @"
server {
  listen 80;
  server_name $Hostname;
  location /health { proxy_pass http://127.0.0.1:4000/health; }
  location / { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
}
"@
  ssh root@$DropletIp "bash -c 'apt update && apt install -y nginx certbot python3-certbot-nginx'"
  $nginxConf | ssh root@$DropletIp "cat > /etc/nginx/sites-available/advancia-api"
  ssh root@$DropletIp "ln -sf /etc/nginx/sites-available/advancia-api /etc/nginx/sites-enabled/advancia-api && nginx -t && systemctl reload nginx"
  ssh root@$DropletIp "certbot --nginx -d $Hostname --redirect --non-interactive --agree-tos -m admin@$Domain" 2>$null
  Write-Host 'NGINX + certbot configured.' -ForegroundColor Green
}
# CORS env enforcement
Write-Host 'Ensuring ALLOWED_ORIGINS in backend .env...' -ForegroundColor Yellow
$allowed = "https://$Domain,https://www.$Domain,https://app.$Domain,https://$Hostname"
ssh root@$DropletIp "grep -q '^ALLOWED_ORIGINS=' $BackendDir/.env && sed -i 's/^ALLOWED_ORIGINS=.*/ALLOWED_ORIGINS=$allowed/' $BackendDir/.env || echo 'ALLOWED_ORIGINS=$allowed' >> $BackendDir/.env"
if($PrismaMigrate){
  Write-Host 'Running prisma migrate deploy...' -ForegroundColor Yellow
  ssh root@$DropletIp "cd $BackendDir && npx prisma migrate deploy"
}
Write-Host 'Health check probe:' -ForegroundColor Cyan
try { $r = Invoke-WebRequest "https://$Hostname/health" -UseBasicParsing -TimeoutSec 10; Write-Host "Status $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host 'Health check failed (may need propagation).' -ForegroundColor Yellow }
Write-Host 'DONE. Verify SSL (SSL Labs) & remove unused mode (ARecord vs Tunnel).' -ForegroundColor Magenta
