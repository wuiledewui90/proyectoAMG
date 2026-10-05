# Auditoría de preparación para Hostinger

Fecha: 4 de octubre de 2026

## Estado verificado

- Compilación Next.js de producción: correcta.
- TypeScript: sin errores.
- ESLint: sin errores; permanecen advertencias no bloqueantes de navegación interna y componentes auxiliares.
- Prisma: esquema válido.
- Migraciones: 23 encontradas y aplicadas en la base local auditada.
- Dependencias de producción: 0 vulnerabilidades conocidas informadas por `pnpm audit --prod`.
- Archivos `.env`: ignorados por Git.
- Secretos detectados en archivos versionados: ninguno.
- Servidor compilado: responde correctamente.
- Cabeceras CSP y anti-iframe: presentes.
- Redirección de `/admin` sin sesión: correcta.
- Solicitud POST con origen externo: bloqueada con HTTP 403.

## Cambios de seguridad aplicados

- Next.js actualizado a una versión corregida.
- Reemplazo de la librería de planillas vulnerable por ExcelJS.
- Eliminación de la opción que ignoraba errores de TypeScript durante el build.
- Validación central de variables antes del build de Hostinger.
- Cliente Supabase marcado como exclusivo de servidor.
- Límite de intentos de acceso y recuperación.
- Comparación bcrypt simulada para evitar diferencias de tiempo al consultar usuarios inexistentes.
- Contraseñas nuevas con mínimo, máximo y combinación de letras/números.
- Protección de APIs de escritura frente a orígenes externos.
- Cabeceras CSP, HSTS, anti-MIME, anti-iframe, permisos y referencia.
- Pedidos públicos validados y recalculados con el catálogo leído por el servidor.
- Tamaño y cantidad de datos de pedido limitados.
- Archivos de logs, ZIP, backups y entornos excluidos de Git.

## Configuración que falta completar en Hostinger

Las variables reales deben cargarse en hPanel. El archivo local auditado todavía utiliza credenciales administrativas que no cumplen la política de producción:

- `ADMIN_PASS_HASH` debe reemplazarse por un hash bcrypt real.
- `ADMIN_SECRET` debe reemplazarse por un valor aleatorio de al menos 32 caracteres.
- `APP_URL` debe configurarse con el dominio HTTPS final.
- `DATABASE_URL` debe apuntar a la base MySQL del cliente en Hostinger.

La validación fue comprobada con credenciales temporales generadas en memoria y funciona correctamente. No se guardaron ni mostraron esos valores.

## Límites y decisiones pendientes

- La limitación de intentos reside en memoria y es adecuada para una única instancia. Si en el futuro se ejecutan varias instancias, debe trasladarse a Redis o a una tabla con expiración.
- Supabase entrega catálogo e imágenes; MySQL continúa almacenando operaciones del ERP. La sincronización atómica de stock entre ambos sistemas requiere una RPC confirmada y una estrategia de reintentos. No se activó una escritura remota sin verificar previamente su firma y permisos.
- Antes de importar la base a Hostinger debe crearse y probarse una copia de seguridad restaurable.
- No se ejecutaron migraciones ni cambios en bases de producción.

## Dictamen

El código está preparado para un despliegue controlado en Hostinger. La publicación debe detenerse si `pnpm deploy:check` no termina correctamente o si no existe una copia restaurable de MySQL.
