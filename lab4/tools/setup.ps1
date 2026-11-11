$ErrorActionPreference = 'Stop'
$repository = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$cache = Join-Path $repository '.cache/lab4'
$toolchain = Get-Content (Join-Path $PSScriptRoot 'toolchain.json') -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Path $cache -Force | Out-Null

function Get-VerifiedDownload($Url, $Path, $Sha256) {
    if (-not (Test-Path -LiteralPath $Path)) {
        Invoke-WebRequest -Uri $Url -OutFile $Path
    }
    $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $Sha256) {
        throw "SHA-256 mismatch for $Path. Remove that file and repeat setup."
    }
}

Get-VerifiedDownload $toolchain.plantuml.url (Join-Path $cache $toolchain.plantuml.file) $toolchain.plantuml.sha256
$archive = Join-Path $cache 'jre.zip'
Get-VerifiedDownload $toolchain.jre.url $archive $toolchain.jre.sha256
$java = Join-Path $cache $toolchain.jre.java
if (-not (Test-Path -LiteralPath $java)) {
    Expand-Archive -LiteralPath $archive -DestinationPath $cache -Force
}
& $java -version
if ($LASTEXITCODE -ne 0) { throw 'Java startup failed' }
Write-Output 'PASS portable Java and verified PlantUML are ready in .cache/lab4'
