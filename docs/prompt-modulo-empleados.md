# Prompt reutilizable: módulo profesional de empleados

## Instrucción principal

Implementá en este proyecto un **módulo profesional de Empleados, Novedades Laborales y Liquidación de Sueldos**. Debe quedar completamente funcional, conectado a la base de datos real y adaptado a la arquitectura, autenticación, permisos, componentes y convenciones visuales existentes del proyecto.

No construyas solamente una maqueta. Implementá modelo de datos, migraciones, API o acciones de servidor, interfaz, validaciones, cálculos, permisos y estados completos.

Antes de modificar archivos:

1. Inspeccioná la estructura y tecnologías del proyecto.
2. Reutilizá sus componentes, estilos, sesión y sistema de permisos.
3. Conservá los cambios existentes y evitá reescribir funcionalidades que no pertenezcan al módulo.
4. Si ya existe un módulo de empleados, amplialo sin perder los datos registrados.

## Acceso y navegación

- Agregá el acceso **Empleados** al panel lateral administrativo.
- Ubicalo dentro de la sección **Gestión** o su equivalente.
- Utilizá un icono coherente con el sistema visual del proyecto.
- El módulo debe estar disponible únicamente para usuarios con rol **ADMIN**.
- Protegé tanto la pantalla como todas las operaciones del servidor. No alcanza con ocultar botones.

## Diseño visual obligatorio

La interfaz debe tener un estilo **Apple moderno y profesional**:

- Fondo claro y limpio.
- Tarjetas blancas o translúcidas.
- Bordes sutiles.
- Sombras suaves.
- Esquinas amplias y redondeadas.
- Tipografía clara, jerarquía visual fuerte y mucho espacio respirable.
- Colores de estado discretos: azul, verde, naranja y rojo.
- Botones principales oscuros o de alto contraste.
- Formularios fáciles de leer y completar.
- Diseño responsive para escritorio, tablet y móvil.
- No usar tablas rígidas en móvil; adaptar la información a tarjetas o bloques apilados.
- Mantener el mismo estilo en listado, detalle, formularios, novedades y liquidaciones.

## Pantalla principal

La pantalla debe incluir:

1. Encabezado con título **Empleados**, descripción y botón **Nuevo empleado**.
2. Indicadores rápidos:
   - Empleados activos.
   - Horas extra pendientes de liquidar.
   - Total de la nómina del mes.
3. Buscador por:
   - Nombre y apellido.
   - DNI.
   - Número de legajo.
   - Puesto.
4. Listado de empleados con:
   - Iniciales o avatar.
   - Nombre completo.
   - Número de legajo.
   - Puesto.
   - Indicador de activo o inactivo.
5. Panel de detalle del empleado seleccionado.
6. Acciones para editar y eliminar el empleado.

## Legajo profesional del empleado

El formulario de alta y edición debe incluir como mínimo:

### Datos personales

- Número de legajo obligatorio y único.
- Nombre obligatorio.
- Apellido obligatorio.
- DNI obligatorio y único.
- CUIL opcional y único cuando se informa.
- Fecha de nacimiento.
- Teléfono.
- Correo electrónico.
- Domicilio.
- Ciudad.

### Datos laborales

- Puesto obligatorio.
- Área o departamento.
- Tipo de contrato:
  - Permanente.
  - Temporal.
  - Contratado.
  - Media jornada.
- Fecha de ingreso obligatoria.
- Fecha de egreso opcional.
- Empleado activo o inactivo.

### Datos bancarios y de salud

- Banco.
- CBU o alias.
- Obra social.
- Contacto de emergencia.
- Teléfono de emergencia.
- Observaciones generales.

## Modalidad de pago y jornada

Agregar un selector obligatorio de modalidad de pago con estas opciones:

- Diario.
- Semanal.
- Quincenal.
- Mensual.

También solicitar:

- Importe del pago acordado según la modalidad elegida.
- Horas normales de trabajo por día.
- Días trabajados por semana.

El **valor hora no debe ingresarse manualmente**. Debe calcularse y mostrarse automáticamente.

### Fórmulas del valor hora

Usar estas fórmulas:

- Pago diario: `pago diario / horas por día`.
- Pago semanal: `pago semanal / (horas por día × días por semana)`.
- Pago quincenal: `pago quincenal / (horas por día × días por semana × 2)`.
- Pago mensual: `pago mensual / (horas por día × días por semana × 52 / 12)`.

Mostrar en tiempo real:

- Valor hora calculado.
- Equivalente mensual estimado.

### Equivalente mensual

- Diario: `pago diario × días por semana × 52 / 12`.
- Semanal: `pago semanal × 52 / 12`.
- Quincenal: `pago quincenal × 26 / 12`.
- Mensual: `pago mensual`.

El servidor debe volver a calcular estos valores. Nunca confiar únicamente en el cálculo enviado por el navegador.

## Detalle laboral del empleado

Una vez creado el empleado, mostrar en su ficha:

- Legajo.
- DNI y CUIL.
- Fecha de ingreso.
- Tipo de contrato.
- Modalidad de pago.
- Horas diarias y días semanales.
- Pago acordado.
- Valor hora calculado.
- Equivalente mensual.
- Estado activo o inactivo.

Debajo de la ficha deben existir tres áreas principales:

1. Horas extra.
2. Novedades y descuentos.
3. Liquidación de sueldo.

## Horas extra

Permitir registrar horas extra después de crear el empleado.

Cada registro debe incluir:

- Fecha.
- Cantidad de horas, permitiendo fracciones de 0,25 horas.
- Tipo de recargo:
  - 50%, multiplicador `1.5`.
  - 100%, multiplicador `2`.
- Motivo o trabajo realizado.
- Valor hora utilizado.
- Importe calculado.
- Estado pendiente o liquidado.

Fórmula:

`importe de horas extra = cantidad de horas × valor hora calculado × multiplicador`

El valor hora debe tomarse del empleado en el momento de registrar las horas extra para conservar el importe histórico aunque luego cambie su sueldo.

Permitir listar y eliminar registros. Indicar visualmente cuáles ya fueron incluidos en una liquidación.

## Novedades laborales

Crear un registro profesional de novedades laborales con los siguientes tipos:

- Ausencia.
- Vacaciones.
- Rotura o daño.
- Suspensión.
- Premio o adicional.
- Otro descuento.
- Otro adicional.

Cada novedad debe permitir indicar:

- Tipo.
- Fecha desde.
- Fecha hasta opcional.
- Motivo o referencia obligatoria.
- Unidad de cálculo:
  - Horas.
  - Días.
  - Importe fijo.
- Cantidad.
- Importe resultante.
- Impacto en el sueldo:
  - Suma al sueldo.
  - Descuenta del sueldo.
  - Solo informativo.
- Estado pendiente o liquidado.

### Valores predeterminados

- Ausencia: días y descuento.
- Vacaciones: días y solo informativo, permitiendo cambiar el impacto si corresponde.
- Rotura o daño: importe fijo y descuento.
- Suspensión: días y descuento.
- Premio o adicional: importe fijo y suma.
- Otro descuento: importe fijo y descuento.
- Otro adicional: importe fijo y suma.

### Cálculo automático de novedades

- Por horas: `cantidad × valor hora`.
- Por días: `cantidad × horas por día × valor hora`.
- Importe fijo: usar el importe ingresado.
- Informativo: importe con impacto de liquidación igual a cero.

Mostrar el impacto estimado antes de guardar la novedad.

Permitir listar y eliminar novedades. Diferenciar visualmente adicionales, descuentos e informativas.

## Liquidación de sueldo

Permitir generar una liquidación mensual seleccionando el período `AAAA-MM`.

La liquidación debe incluir automáticamente:

- Equivalente mensual del pago acordado.
- Horas extra pendientes cuya fecha pertenezca al período.
- Novedades adicionales pendientes del período.
- Novedades de descuento pendientes del período.
- Bonificación manual opcional.
- Descuento manual opcional.
- Observaciones.

### Fórmulas

`sueldo bruto = base mensual + horas extra + adicionales automáticos + bonos manuales`

`sueldo neto = máximo entre 0 y (sueldo bruto - descuentos automáticos - descuentos manuales)`

Guardar en la liquidación una copia histórica de todos los importes calculados:

- Base mensual.
- Cantidad e importe de horas extra.
- Bonos manuales.
- Descuentos manuales.
- Adicionales provenientes de novedades.
- Descuentos provenientes de novedades.
- Sueldo bruto.
- Sueldo neto.

No recalcular liquidaciones históricas cuando se edite posteriormente el sueldo del empleado.

Al generar la liquidación:

- Marcar las horas extra incluidas como liquidadas.
- Marcar las novedades incluidas como liquidadas.
- Relacionar las novedades con la liquidación correspondiente.
- No incluir nuevamente registros ya liquidados.
- No permitir dos liquidaciones para el mismo empleado y período.

Estados de liquidación:

- Borrador.
- Aprobada.
- Pagada.

Al pasarla a pagada, guardar fecha y hora del pago.

Permitir eliminar una liquidación con confirmación. Al eliminarla, las novedades relacionadas deben volver a estado pendiente para poder recalcularlas. Mantener una política coherente para las horas extra y evitar que se dupliquen.

## Modelo de datos mínimo

Crear o adaptar entidades equivalentes a:

### Employee

- Identificación y datos personales.
- Información laboral.
- `baseSalary` o pago acordado.
- `paymentFrequency`.
- `hoursPerDay`.
- `workDaysPerWeek`.
- `hourlyRate` calculado.
- Datos bancarios, salud y emergencia.
- Estado activo.
- Fechas de creación y modificación.

### EmployeeOvertime

- Empleado.
- Fecha.
- Horas.
- Multiplicador.
- Valor hora histórico.
- Importe.
- Descripción.
- Estado liquidado.

### EmployeeAdjustment

- Empleado.
- Liquidación opcional.
- Tipo.
- Impacto.
- Fecha desde y hasta.
- Cantidad.
- Unidad.
- Valor unitario.
- Importe.
- Descripción.
- Estado liquidado.

### EmployeePayroll

- Empleado.
- Período.
- Base histórica.
- Horas e importe extra.
- Bonos y descuentos manuales.
- Adicionales y descuentos por novedades.
- Bruto.
- Neto.
- Estado.
- Fecha de pago.
- Observaciones.
- Fechas de creación y modificación.

Agregar relaciones, índices, restricciones únicas y borrado en cascada o desvinculación segura según corresponda.

## Validaciones obligatorias

- No aceptar importes negativos.
- Horas por día: mayor que cero y máximo 24.
- Días por semana: mayor que cero y máximo 7.
- Horas extra: mayor que cero y máximo 24 por registro.
- Multiplicador de horas extra válido.
- Fechas válidas.
- Cantidades mayores que cero.
- DNI y legajo únicos.
- CUIL único cuando se informa.
- Período con formato válido.
- Empleado existente y válido para cada operación.
- Mensajes de error claros en español.
- Confirmación antes de cualquier eliminación definitiva.

## API y seguridad

- Todas las rutas deben verificar la sesión en el servidor.
- Solo el rol ADMIN puede consultar o modificar empleados y liquidaciones.
- Validar y normalizar todos los campos en el servidor.
- Limitar la longitud de textos.
- Manejar correctamente errores por datos duplicados.
- Usar transacciones al generar o eliminar liquidaciones.
- No exponer información sensible innecesaria.
- Devolver importes decimales serializados como números utilizables por la interfaz.

## Experiencia de uso

- Mostrar estados de carga y guardado.
- Mostrar confirmación al guardar.
- Conservar seleccionado el empleado después de actualizar los datos.
- Actualizar métricas, historial y liquidaciones sin recargar manualmente la página.
- Mostrar estados vacíos claros.
- Los formularios deben poder utilizarse con teclado y móvil.
- No cortar textos importantes.
- Mantener visibles los importes calculados antes de confirmar.

## Compatibilidad y migración

Si existen empleados anteriores:

- No eliminar ni sobrescribir datos.
- Asignar por defecto modalidad mensual.
- Usar inicialmente 8 horas por día.
- Usar inicialmente 5 días por semana.
- Mantener el valor hora existente hasta que el legajo sea editado o recalculado de forma segura.

Crear y aplicar una migración incremental. No reiniciar la base de datos ni utilizar operaciones destructivas.

## Verificación final obligatoria

Antes de dar por terminada la tarea:

1. Aplicar y validar las migraciones.
2. Regenerar el cliente de base de datos si corresponde.
3. Ejecutar el análisis de tipos.
4. Ejecutar el linter.
5. Verificar que el proyecto compile.
6. Comprobar la versión responsive.
7. Probar este flujo completo:
   - Crear empleado mensual.
   - Crear empleado diario, semanal o quincenal.
   - Confirmar el cálculo del valor hora.
   - Registrar horas extra.
   - Registrar ausencia, vacaciones, rotura y suspensión.
   - Registrar un premio.
   - Generar una liquidación.
   - Confirmar sumas, descuentos y sueldo neto.
   - Cambiar el estado a pagada.
   - Eliminar una novedad pendiente.
   - Eliminar una liquidación y comprobar la recuperación de novedades.
8. Informar brevemente qué se implementó, qué archivos principales se modificaron y qué verificaciones pasaron.

## Criterio de finalización

La tarea solo se considera terminada cuando el módulo funciona con datos reales, conserva el historial, realiza los cálculos en el servidor, tiene permisos efectivos, responde correctamente en móvil y mantiene el estilo Apple del panel administrativo.
