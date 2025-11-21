Param(
    [string]$BaseUrl = "https://advancia-backend.onrender.com",
    [int]$TimeoutSec = 15,
    [int]$Retries = 1,
    [int]$DelaySec = 30,
    [int]$TrimBodyChars = 600,
    [switch]$ShowAllHeaders
)

function Convert-HeadersToHash {
    param([object]$Headers)
    $h = @{}
    if ($null -eq $Headers) { return $h }
    try {
        foreach ($k in $Headers.Keys) {
            $h[$k] = ($Headers[$k] -join ',')
        }
    } catch {
        # Fallback for WebHeaderCollection (PowerShell 5.1)
        foreach ($k in $Headers.AllKeys) {
            $h[$k] = ($Headers.GetValues($k) -join ',')
        }
    }
    return $h
}

function Read-ResponseBody {
    param([object]$Response)
    try {
        if ($Response -and $Response.Content) { return [string]$Response.Content }
        if ($Response -and $Response.GetResponseStream) {
            $sr = New-Object System.IO.StreamReader($Response.GetResponseStream())
            return $sr.ReadToEnd()
        }
    } catch { }
    return $null
}

function Format-Headers {
    param([hashtable]$Headers)
    if (-not $Headers) { return @{} }
    $interesting = @('date','content-type','server','via','cf-ray','x-request-id','x-render-request-id','x-powered-by')
    $out = @{}
    foreach ($name in $interesting) {
        $key = ($Headers.Keys | Where-Object { $_ -ieq $name } | Select-Object -First 1)
        if ($key) { $out[$name] = $Headers[$key] }
    }
    if ($ShowAllHeaders) { return $Headers }
    return $out
}

function Trim-Body {
    param([string]$Body, [int]$Limit)
    if (-not $Body) { return $null }
    if ($Body.Length -le $Limit) { return $Body }
    return ($Body.Substring(0, $Limit) + "... [trimmed]")
}

function Invoke-Once {
    param([string]$Path)
    $url = "$BaseUrl$Path"
    $headers = @{ 'Cache-Control' = 'no-cache' }

    $supportsSkip = (Get-Command Invoke-WebRequest).Parameters.ContainsKey('SkipHttpErrorCheck')
    if ($supportsSkip) {
        $resp = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec $TimeoutSec -Headers $headers -SkipHttpErrorCheck
        return [pscustomobject]@{
            Url     = $url
            Status  = [int]$resp.StatusCode
            Headers = (Convert-HeadersToHash $resp.Headers)
            Body    = ($resp.Content)
        }
    }

    # PowerShell 5.1 fallback
    try {
        $resp = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec $TimeoutSec -Headers $headers
        return [pscustomobject]@{
            Url     = $url
            Status  = [int]$resp.StatusCode
            Headers = (Convert-HeadersToHash $resp.Headers)
            Body    = ($resp.Content)
        }
    } catch {
        $ex = $_.Exception
        $rawResp = $ex.Response
        $status = $null
        $hdrs = $null
        if ($rawResp) {
            try { $status = [int]$rawResp.StatusCode } catch { $status = 'ERROR' }
            try { $hdrs = Convert-HeadersToHash $rawResp.Headers } catch { $hdrs = @{} }
        }
        return [pscustomobject]@{
            Url     = $url
            Status  = $status
            Headers = $hdrs
            Body    = (Read-ResponseBody $rawResp) ?? $ex.Message
        }
    }
}

function Test-Endpoint {
    param([string]$Path)
    $last = $null
    for ($i = 1; $i -le [Math]::Max(1,$Retries); $i++) {
        $last = Invoke-Once -Path $Path
        if ($last.Status -is [int] -and $last.Status -ge 200 -and $last.Status -lt 400) { break }
        if ($i -lt $Retries) { Start-Sleep -Seconds $DelaySec }
    }
    # Trim and format headers
    $headersHash = Convert-HeadersToHash $last.Headers
    $formattedHeaders = Format-Headers $headersHash
    $trimmedBody = Trim-Body -Body ([string]$last.Body) -Limit $TrimBodyChars
    return [pscustomobject]@{
        Url     = $last.Url
        Status  = $last.Status
        Headers = $formattedHeaders
        Body    = $trimmedBody
    }
}

$health = Test-Endpoint "/health"
$joke   = Test-Endpoint "/joke"

Write-Host "Health:" -ForegroundColor Cyan
$health | Format-List

Write-Host "\nJoke:" -ForegroundColor Cyan
$joke | Format-List
