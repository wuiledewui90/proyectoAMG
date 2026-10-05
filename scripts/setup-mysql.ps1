param(
  [ValidatePattern('^[A-Za-z0-9_]+$')]
  [string]$DatabaseName = 'radiadores_amg',

  [ValidatePattern('^[A-Za-z0-9_]+$')]
  [string]$DatabaseUser = 'radiadores_amg',

  [string]$AdminUser = 'admin',

  [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env.local'

if (Test-Path -LiteralPath $envPath) {
  throw '.env.local ya existe. No se reemplazará la configuración local ni se modificará MySQL.'
}
$mysqlCandidates = @(
  'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe',
  'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
  'C:\xampp\mysql\bin\mysql.exe'
)

function ConvertTo-PlainText([Security.SecureString]$SecureValue) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

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

$mysql = $mysqlCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $mysql) {
  $mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
  if ($mysqlCommand) {
    $mysql = $mysqlCommand.Source
  }
}

if (-not $mysql) {
  throw 'No se encontro mysql.exe. Instala MySQL Server/Client antes de ejecutar este script.'
}

$rootPasswordSecure = Read-Host 'Clave actual del usuario root de MySQL' -AsSecureString
$adminPasswordSecure = Read-Host 'Nueva clave para el panel administrativo' -AsSecureString
$rootPassword = ConvertTo-PlainText $rootPasswordSecure
$adminPassword = ConvertTo-PlainText $adminPasswordSecure

if ([string]::IsNullOrWhiteSpace($rootPassword)) {
  throw 'La clave root de MySQL no puede estar vacia.'
}
if ($adminPassword.Length -lt 12) {
  throw 'La clave del panel debe tener al menos 12 caracteres.'
}

$databasePassword = New-RandomBase64Url 24
$adminSecret = New-RandomBase64Url 48

Push-Location $projectRoot
try {
  $env:AMG_SETUP_ADMIN_PASSWORD = $adminPassword
  $adminHash = (& node -e "const bcrypt=require('bcryptjs'); process.stdout.write(bcrypt.hashSync(process.env.AMG_SETUP_ADMIN_PASSWORD, 12))").Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($adminHash)) {
    throw 'No se pudo generar el hash bcrypt. Ejecuta pnpm install y vuelve a intentar.'
  }
  $escapedAdminHash = $adminHash.Replace('$', '\$')

  $sql = @"
CREATE DATABASE IF NOT EXISTS $DatabaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DatabaseUser'@'localhost' IDENTIFIED BY '$databasePassword';
ALTER USER '$DatabaseUser'@'localhost' IDENTIFIED BY '$databasePassword';
GRANT ALL PRIVILEGES ON $DatabaseName.* TO '$DatabaseUser'@'localhost';
FLUSH PRIVILEGES;
"@

  $env:MYSQL_PWD = $rootPassword
  $sql | & $mysql --protocol=TCP --host=127.0.0.1 --port=3306 --user=root --batch
  if ($LASTEXITCODE -ne 0) {
    throw 'MySQL rechazo la configuracion. Verifica la clave de root.'
  }

  $envLines = @(
    "DATABASE_URL=`"mysql://${DatabaseUser}:${databasePassword}@127.0.0.1:3306/${DatabaseName}`"",
    '',
    "ADMIN_USER=`"$AdminUser`"",
    "ADMIN_PASS_HASH=`"$escapedAdminHash`"",
    "ADMIN_SECRET=`"$adminSecret`""
  )
  [IO.File]::WriteAllLines($envPath, $envLines, [Text.UTF8Encoding]::new($false))

  & pnpm exec prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw 'Fallo prisma migrate deploy.' }

  & pnpm exec prisma generate
  if ($LASTEXITCODE -ne 0) { throw 'Fallo prisma generate.' }

  if (-not $SkipSeed) {
    & pnpm run db:seed
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la carga de datos iniciales.' }
  }

  Write-Host "Base '$DatabaseName' lista y .env.local creado correctamente." -ForegroundColor Green
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
  Remove-Item Env:AMG_SETUP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  $rootPassword = $null
  $adminPassword = $null
  Pop-Location
}
