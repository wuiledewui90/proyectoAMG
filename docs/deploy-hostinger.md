# Despliegue seguro en Hostinger — Radiadores AMG

## 1. Requisitos del plan

Este proyecto es una aplicación Next.js con servidor, MySQL y acceso privado a Supabase. Debe desplegarse como **aplicación Node.js**, no como sitio estático. En Hostinger, usar un plan Business o Cloud que permita aplicaciones Node.js.

Configuración recomendada:

- Node.js: 22 LTS.
- Carpeta raíz: la que contiene `package.json`.
- Instalación: `pnpm install --frozen-lockfile`.
- Build: `pnpm hostinger:build`.
- Inicio: `pnpm start`.
- Puerto: dejar que Hostinger asigne `PORT`; `next start` lo respeta.

### Dependencias del paquete publicado

El repositorio usa `nodeLinker: hoisted` en `pnpm-workspace.yaml` y
`node-linker=hoisted` en `.npmrc` para los runners de pnpm 10 y 11 de Hostinger.
Esto instala las dependencias como directorios reales: el publicador de Hostinger
perdía enlaces del almacén de pnpm y Next.js fallaba al buscar React y SWC.

El build genera `.next/standalone`, copia `public` y `.next/static`, y comprueba
que sus dependencias estén dentro del paquete y no sean enlaces externos.
Hostinger publica ese servidor con `node server.js`; no ejecutar `next start`
dentro de la carpeta standalone. Una compilación exitosa debe verificarse también
en ejecución: `/admin/login` debe entregar HTML y `/management.webmanifest` JSON.

## 2. Publicación recomendada

Vincular un repositorio Git privado. No subir `node_modules`, `.next`, archivos `.env`, registros ni copias de base de datos. Antes de publicar, confirmar que todos los cambios previstos estén versionados y que no haya secretos en el historial.

Si se prefiere carga manual, ejecutar `pnpm deploy:package`. El ZIP limpio se genera en `hostinger-package/proyectoAMG-hostinger.zip`; Hostinger debe compilarlo con las variables cargadas en hPanel.

## 3. Variables de entorno

Cargar estas variables exclusivamente desde **Environment variables** de Hostinger:

```text
DATABASE_URL
APP_URL
ADMIN_USER
ADMIN_PASS_HASH
ADMIN_SECRET
SUPABASE_URL
SUPABASE_SECRET_KEY
SUPABASE_PRODUCTS_TABLE
SUPABASE_STORAGE_BUCKET
```

Reglas importantes:

- `APP_URL` debe ser el dominio final con `https://` y sin rutas.
- `ADMIN_PASS_HASH` debe ser bcrypt; nunca cargar la contraseña en texto plano.
- `ADMIN_SECRET` debe ser aleatorio y tener como mínimo 32 caracteres.
- `SUPABASE_URL` debe terminar en `.supabase.co`, sin `/rest/v1`.
- `SUPABASE_SECRET_KEY` jamás debe llamarse `NEXT_PUBLIC_*`.
- No subir un `.env` real al repositorio ni incluirlo en un ZIP.

El comando `pnpm deploy:check` valida los nombres y formatos sin mostrar los valores.

## 4. Base MySQL

La base MySQL guarda las operaciones del ERP. Supabase aporta el catálogo y las imágenes, pero no reemplaza esta base.

Para el primer despliegue:

1. Crear una base MySQL exclusiva para este cliente en Hostinger.
2. Crear un usuario con acceso solamente a esa base.
3. Realizar una copia de seguridad de la base actual.
4. Importar los datos en la nueva base de forma controlada.
5. Configurar `DATABASE_URL` con los datos de Hostinger y la contraseña codificada para URL.
6. Con la copia ya verificada, ejecutar una sola vez `pnpm db:deploy` para aplicar migraciones pendientes.

`prisma migrate deploy` no se ejecuta automáticamente durante el build para evitar alterar producción sin revisión.

## 5. Supabase

- Mantener `productos` como tabla de catálogo y `fotos` como bucket, si coinciden con el proyecto auditado.
- La clave `service_role` es solo para el servidor.
- Revisar periódicamente sus permisos y conservar únicamente los necesarios.
- El navegador nunca debe recibir la Secret Key.

## 6. Secuencia de salida a producción

1. Ejecutar localmente `pnpm install --frozen-lockfile`.
2. Ejecutar `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build`.
3. Crear y comprobar una copia de MySQL.
4. Publicar en Hostinger con un dominio temporal.
5. Cargar las variables desde hPanel.
6. Ejecutar `pnpm db:deploy` una vez autorizada la migración.
7. Probar catálogo, imágenes, login, pedidos, ventas, caja y empleados.
8. Asociar el dominio final, habilitar SSL y actualizar `APP_URL`.
9. Activar 2FA en Hostinger y Supabase.
10. Confirmar backups automáticos de MySQL y conservar una copia externa cifrada.

## 7. Controles incluidos en el proyecto

- Validación de variables antes del build de Hostinger.
- Secretos de Supabase exclusivos del servidor.
- Cookies administrativas `httpOnly`, `sameSite` y `secure` en producción.
- Límite de intentos de login y recuperación.
- Protección de mutaciones contra orígenes externos.
- Cabeceras CSP, anti-iframe, MIME, permisos, referencia y HSTS.
- Pedidos recalculados con los precios del catálogo del servidor.
- Límite de tamaño y tipo para importaciones e imágenes.
- TypeScript obligatorio durante la compilación.

## 8. Comprobación posterior

- Abrir el sitio en incógnito y confirmar HTTPS sin advertencias.
- Verificar que `/admin` redirija a `/admin/login` sin sesión.
- Confirmar que las imágenes se sirvan desde Supabase.
- Crear un pedido de prueba y comprobar que el total no dependa del navegador.
- Verificar alta, anulación y auditoría de una venta de prueba.
- Revisar los logs sin encontrar claves, contraseñas ni cadenas de conexión.
- Ejecutar una restauración de prueba de la copia MySQL antes de considerar cerrado el despliegue.
