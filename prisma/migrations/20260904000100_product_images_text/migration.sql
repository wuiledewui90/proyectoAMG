-- El esquema actual serializa la lista de imagenes como texto JSON.
-- Esta migracion alinea las instalaciones nuevas y existentes con schema.prisma.
ALTER TABLE `Product` MODIFY `images` LONGTEXT NOT NULL;
