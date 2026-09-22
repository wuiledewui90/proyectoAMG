param(
  [ValidateRange(1024, 65535)]
  [int]$HostPort = 3307,

  [ValidatePattern('^[A-Za-z0-9_]+$')]
  [string]$DatabaseName = 'radiadores_amg',

  [ValidatePattern('^[A-Za-z0-9_]+$')]
  [string]$DatabaseUser = 'radiadores_amg',

  [string]$AdminUser = 'admin',

  [string]$AdminPassword,

  [switch]$SkipSeed,

  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appEnvPath = Join-Path $projectRoot '.env'
$dockerEnvPath = Join-Path $projectRoot '.env.docker'

function New-RandomBase64Url([int]$ByteCount) {
  $bytes = New-Object byte[] $ByteCount
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  }
  finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker no esta instalado o no se encuentra en PATH.'
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw 'Docker Desktop no esta iniciado. Abre Docker Desktop y vuelve a ejecutar pnpm db:setup.'
}

$occupiedPort = Get-NetTCPConnection -LocalPort $HostPort -State Listen -ErrorAction SilentlyContinue
if ($occupiedPort) {
  $composeContainers = & docker compose --env-file $dockerEnvPath ps --format json 2>$null
  if ($LASTEXITCODE -ne 0 -or $composeContainers -notmatch 'proyectoamg-mysql') {
    throw "El puerto $HostPort ya esta ocupado. Usa: powershell -File scripts/setup-docker-mysql.ps1 -HostPort OTRO_PUERTO"
  }
}

if (-not $Force -and ((Test-Path -LiteralPath $appEnvPath) -or (Test-Path -LiteralPath $dockerEnvPath))) {
  throw 'Ya existe .env o .env.docker. Usa -Force solamente si deseas reemplazar la configuracion local.'
}

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
  $AdminPassword = New-RandomBase64Url 18
}
if ($AdminPassword.Length -lt 12) {
  throw 'La clave del panel debe tener al menos 12 caracteres.'
}

$databasePassword = New-RandomBase64Url 24
$rootPassword = New-RandomBase64Url 32
$adminSecret = New-RandomBase64Url 48

Push-Location $projectRoot
try {
  $env:AMG_SETUP_ADMIN_PASSWORD = $AdminPassword
  $adminHash = (& node -e "const bcrypt=require('bcryptjs'); process.stdout.write(bcrypt.hashSync(process.env.AMG_SETUP_ADMIN_PASSWORD, 12))").Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($adminHash)) {
    throw 'No se pudo generar el hash bcrypt. Ejecuta pnpm install y vuelve a intentar.'
  }
  $escapedAdminHash = $adminHash.Replace('$', '\$')

  $dockerEnvLines = @(
    "MYSQL_HOST_PORT=$HostPort",
    "MYSQL_DATABASE=$DatabaseName",
    "MYSQL_USER=$DatabaseUser",
    "MYSQL_PASSWORD=$databasePassword",
    "MYSQL_ROOT_PASSWORD=$rootPassword"
  )
  [IO.File]::WriteAllLines($dockerEnvPath, $dockerEnvLines, [Text.UTF8Encoding]::new($false))

  $appEnvLines = @(
    "DATABASE_URL=`"mysql://${DatabaseUser}:${databasePassword}@127.0.0.1:${HostPort}/${DatabaseName}`"",
    '',
    "ADMIN_USER=`"$AdminUser`"",
    "ADMIN_PASS_HASH=`"$escapedAdminHash`"",
    "ADMIN_SECRET=`"$adminSecret`""
  )
  [IO.File]::WriteAllLines($appEnvPath, $appEnvLines, [Text.UTF8Encoding]::new($false))

  & docker compose --env-file $dockerEnvPath up -d mysql
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar MySQL con Docker Compose.' }

  Write-Host 'Esperando que MySQL quede saludable...'
  $healthy = $false
  for ($attempt = 1; $attempt -le 40; $attempt += 1) {
    $health = (& docker inspect --format '{{.State.Health.Status}}' proyectoamg-mysql 2>$null).Trim()
    if ($health -eq 'healthy') {
      $healthy = $true
      break
    }
    Start-Sleep -Seconds 2
  }
  if (-not $healthy) {
    & docker compose --env-file $dockerEnvPath logs --tail 100 mysql
    throw 'MySQL no alcanzo el estado healthy.'
  }

  & pnpm exec prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw 'Fallo prisma migrate deploy.' }

  & pnpm exec prisma generate
  if ($LASTEXITCODE -ne 0) { throw 'Fallo prisma generate.' }

  if (-not $SkipSeed) {
    & pnpm run db:seed
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la carga de datos iniciales.' }
  }

  Write-Host ''
  Write-Host "MySQL Docker listo en 127.0.0.1:$HostPort." -ForegroundColor Green
  Write-Host "Usuario inicial del panel: $AdminUser"
  Write-Host "Clave inicial del panel: $AdminPassword"
  Write-Host 'Guarda esa clave: se muestra solamente al finalizar esta configuracion.'
}
finally {
  Remove-Item Env:AMG_SETUP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Pop-Location
}
