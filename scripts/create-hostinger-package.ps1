$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outputRoot = Join-Path $projectRoot "hostinger-package"
$stagingRoot = Join-Path $outputRoot "proyectoAMG"
$archivePath = Join-Path $outputRoot "proyectoAMG-hostinger.zip"

if (-not $outputRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "La carpeta de salida no pertenece al proyecto."
}

if (Test-Path -LiteralPath $outputRoot) {
  Remove-Item -LiteralPath $outputRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

$excludedDirectories = @(".git", ".next", "node_modules", "hostinger-package", "backups", ".vscode")

Get-ChildItem -LiteralPath $projectRoot -Force | ForEach-Object {
  $name = $_.Name
  $isEnvironmentFile = $name -like ".env*" -and $name -notlike "*.example"
  $isExcludedFile = $name -like "*.log" -or $name -like "*.zip" -or $name -eq "tsconfig.tsbuildinfo"

  if ($excludedDirectories -contains $name -or $isEnvironmentFile -or $isExcludedFile) {
    return
  }

  Copy-Item -LiteralPath $_.FullName -Destination $stagingRoot -Recurse -Force
}

$forbidden = Get-ChildItem -LiteralPath $stagingRoot -Recurse -Force -File | Where-Object {
  $_.Name -eq ".env" -or
  $_.Name -eq ".env.production" -or
  $_.Name -like ".env*.local" -or
  $_.Extension -in @(".log", ".zip")
}

if ($forbidden) {
  throw "El paquete contiene archivos locales que no deben publicarse."
}

Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $archivePath -CompressionLevel Optimal
Remove-Item -LiteralPath $stagingRoot -Recurse -Force

$sizeMb = [math]::Round((Get-Item -LiteralPath $archivePath).Length / 1MB, 1)
Write-Output "Paquete creado: $archivePath ($sizeMb MB)"
