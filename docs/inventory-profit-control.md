# Control de costos, stock y ganancia

El inventario financiero toma como fuente de verdad los productos activos de MySQL. Supabase sigue aportando el catálogo de origen y las imágenes; editar el costo en el ERP **no modifica Supabase**.

## Indicadores

- **Invertido en stock:** suma de `stock × costo` para productos físicos con costo positivo. Los productos sin costo se cuentan como pendientes y no se valorizan como cero.
- **Ganancia bruta potencial:** suma de `stock × (precio de venta − costo)` para esos mismos productos. Es una simulación al precio actual, no dinero cobrado.
- **Ganancia bruta registrada del mes:** ingresos de líneas físicas vendidas con costo histórico conocido, menos `cantidad × costo unitario al vender`. Los descuentos se distribuyen proporcionalmente entre las líneas y el impuesto se excluye. No incluye gastos generales, salarios, devoluciones de otros sistemas ni utilidad neta.
- **Cobertura:** las ventas antiguas y las nuevas líneas sin costo se indican como incompletas; no se les atribuye el costo actual retroactivamente.
- **Alertas de stock:** agotado (`stock = 0`) y bajo mínimo (`0 < stock ≤ mínimo`). Los servicios no se cuentan como existencias.
- **Movimientos recientes:** las altas de productos con unidades iniciales y los ajustes posteriores se registran en `StockMovement`. Cada cambio manual de cantidad exige un motivo; se guardan la cantidad anterior, la nueva y el usuario. Las ventas siguen registrando sus salidas de stock. Si una venta modifica el stock durante una edición, la edición se rechaza para evitar sobrescribirla.

## Datos y despliegue

El costo y el stock mínimo ya existen en `Product`; ahora pueden editarse en Productos. Un costo de cero se presenta como pendiente para artículos físicos. No se han inventado ni rellenado los costos que faltan en Supabase o MySQL.

La migración `20261005000100_add_sale_item_cost_snapshot` agrega dos columnas opcionales a `ErpSaleItem` (`unitCost` e `isStockItem`). No cambia filas anteriores. Antes de desplegar, hacer una copia de seguridad de MySQL y revisar las migraciones pendientes del repositorio. El comando de build habitual ejecuta `prisma migrate deploy`; no publicarlo sin esa revisión. Las nuevas ventas guardan el costo en el momento de la operación para que los cambios de precio/costo posteriores no reescriban la historia.

Solo el rol `ADMIN` puede ver la analítica y los costos del inventario, así como crear, editar, importar, exportar y eliminar productos. Los demás roles ven el catálogo sin el costo en las respuestas de productos.

La importación Excel/CSV deja un motivo automático en cada ajuste de stock. Los movimientos previos a esta implementación no se reconstruyen, y eliminar definitivamente un producto puede eliminar sus movimientos asociados por la relación existente en la base de datos; para preservar el historial, usar la desactivación del producto.
