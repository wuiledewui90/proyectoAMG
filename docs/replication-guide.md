# Radiadores AMG - Guia de replicacion

## 1) Resumen tecnico
- Framework: Next.js (App Router) + TypeScript
- UI: Tailwind CSS + Lucide icons
- DB: Prisma + MySQL (datasource en prisma/schema.prisma)
- API: Routes en app/api
- Admin: rutas en app/admin, login con cookie amg_admin + localStorage
- Catalogo: datos desde Prisma (server) + filtros client-side

## 2) Estructura principal
- app/
  - page.tsx (home)
  - catalogo/ (catalogo publico)
  - admin/ (panel admin)
  - api/ (endpoints)
- components/
  - site-header.tsx
  - site-footer.tsx
- lib/
  - products/ (service, repo, schemas)
  - db/prisma.ts
- prisma/
  - schema.prisma
  - migrations/

## 3) Endpoints clave
- GET /api/products (listado con filtros y paginado)
- POST /api/products (crear producto)
- PUT /api/products/:id (editar producto)
- DELETE /api/products/:id (soft delete)
- DELETE /api/products/:id?hard=true (hard delete)
- POST /api/admin/login (login admin)
- POST /api/admin/logout (logout admin)

## 4) Modelo de datos (Product)
Campos principales:
- id: Int autoincrement
- name, slug (requeridos)
- description, sku, brand, model, category, compatibility (opcionales)
- price (Decimal), stock (Int), isActive (Boolean)
- images (Json), imageUrl (String?)

## 5) Flujo Admin
- Login: /admin/login
- Panel: /admin/productos
- Editar: PUT /api/products/:id
- Desactivar: DELETE /api/products/:id
- Eliminar definitivo: DELETE /api/products/:id?hard=true

## 6) Catalogo
- Server: app/catalogo/page.tsx usa Prisma
- Client: app/catalogo/catalog-client.tsx filtra por busqueda/categoria/marca

## 7) Configuracion de entorno
- DATABASE_URL en .env (MySQL)
- Next.js por default (next.config.mjs)

## 8) Pasos para replicar
1. Instalar dependencias:
   - pnpm install
2. Configurar .env con DATABASE_URL
3. Prisma:
   - pnpm prisma migrate deploy
   - pnpm prisma generate
4. Ejecutar:
   - pnpm dev

## 9) Deploy (Node SSR)
- Requiere hosting con Node y MySQL.
- Build:
  - pnpm build
  - pnpm start

## 10) Notas
- El catalogo usa datos reales de DB.
- El admin requiere cookie amg_admin y localStorage amg-admin-session.
- Boton WhatsApp flotante en app/layout.tsx.
