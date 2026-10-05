# Base de datos local con Docker

El proyecto usa MySQL 8 mediante Prisma. MySQL se ejecuta en Docker y la
aplicacion Next.js se ejecuta en Windows. El archivo `prisma/prisma/dev.db` es un
remanente SQLite y no forma parte de la configuracion activa.

## Puertos

- `127.0.0.1:3307`: MySQL de este proyecto dentro de Docker.
- `127.0.0.1:3306`: queda disponible para LS Carta Digital/MySQL de Windows.

## Preparacion automatica

1. Inicia Docker Desktop y espera a que indique que el motor esta listo.
2. Instala dependencias con `pnpm install --frozen-lockfile`.
3. Ejecuta `pnpm db:setup`.

El script genera claves locales aleatorias, crea `.env.local` y `.env.docker`, inicia
MySQL, espera el healthcheck, aplica migraciones y carga los productos iniciales.
Al finalizar muestra una unica vez el usuario y la clave inicial del panel.

Next.js y la CLI de Prisma leen la misma configuracion local desde `.env.local`.
Ese archivo y `.env.docker` estan ignorados por Git. En Hostinger, las variables
de produccion se configuran en el panel; no se copian desde la PC.

## Comandos diarios

```powershell
pnpm db:docker:up
pnpm db:docker:status
pnpm db:docker:logs
pnpm db:docker:down
npm run dev
```

`db:docker:down` detiene el contenedor sin borrar los datos. Los datos persisten
en el volumen `proyectoamg_mysql_data`.

Para usar otro puerto:

```powershell
powershell -File scripts/setup-docker-mysql.ps1 -HostPort 3308
```

Para produccion usa una instancia MySQL administrada y configura las variables
en el panel de Hostinger. Nunca ejecutes migraciones de produccion desde una
terminal local sin comprobar primero a que base apunta `DATABASE_URL`.
