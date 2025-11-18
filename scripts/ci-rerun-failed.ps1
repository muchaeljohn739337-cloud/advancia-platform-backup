# Optional: Re-run last failed GitHub Actions workflow using gh CLI
# Requirements: GitHub CLI (gh), authenticated: gh auth login
# Run: .\scripts\ci-rerun-failed.ps1

param(
  [string]$Repo = "",
  [switch]$DryRun
)

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Install GitHub CLI: https://cli.github.com/ and run 'gh auth login'" -ForegroundColor Yellow
  exit 0
}

if (-not $Repo) {
  $origin = git remote get-url origin 2>$null
  if ($origin -match "github.com[:/](.+?)(\.git)?$") { $Repo = $Matches[1] }
}

if (-not $Repo) { Write-Host "Unable to determine repo owner/name. Pass -Repo <owner/name>" -ForegroundColor Red; exit 1 }

Write-Host ("Target repo: {0}" -f $Repo) -ForegroundColor Cyan
$failed = gh run list --repo $Repo --limit 20 --json databaseId,status,conclusion,displayTitle,headBranch | ConvertFrom-Json | Where-Object { $_.conclusion -eq 'failure' }
if (-not $failed) { Write-Host "No failed runs found in last 20 runs." -ForegroundColor Green; exit 0 }
$target = $failed[0]
Write-Host ("Re-running failed workflow: {0} (branch: {1})" -f $target.displayTitle,$target.headBranch) -ForegroundColor Yellow
if ($DryRun) { Write-Host "DryRun: would rerun run ID $($target.databaseId)" -ForegroundColor Yellow; exit 0 }

gh run rerun $target.databaseId --repo $Repo | Out-Null
Write-Host "Rerun triggered." -ForegroundColor Green
