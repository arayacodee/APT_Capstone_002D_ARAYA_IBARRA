# Registro e historial de atenciones

Desde el panel, **Marcar como atendido** abre una ventana con cliente, servicio,
fecha, tarifa, notas (hasta 1500 caracteres) y una evidencia opcional con descripción
(hasta 300 caracteres). Abrir o cancelar no modifica la reserva. Guardar completa la
reserva, registra la nota y sube la imagen JPEG, PNG o WebP de hasta 5 MB. Si la
subida falla, la ventana indica lo que ya se guardó y permite reintentar la imagen
usando la misma atención. Cerrar en ese estado conserva la atención; la evidencia
se puede agregar posteriormente desde su detalle.

El historial muestra 10 atenciones por página con navegación anterior/siguiente
mediante cursores del servidor, ordenadas por fecha descendente e ID como desempate.
Las filas muestran cliente, servicio, fecha, valor, notas resumidas y cantidad de
imágenes. **Ver detalle** abre una vista de consulta, con edición de notas y evidencias
disponible mediante una acción explícita. Se mantienen los permisos del propietario.

## Valores y migración

La migración `20261022143000_session_amount` agrega `ClientSession.amount`, decimal
nullable, y un índice por negocio y fecha. Al completar una reserva se guarda la
tarifa del servicio en la misma transacción, independientemente de cambios futuros
de precio. No representa un pago confirmado. Las atenciones antiguas quedan sin
importe: la base anterior no guardaba precios históricos y la tarifa actual no
permite reconstruirlos de forma fiable. La interfaz indica **Sin registro** y el
resumen informa cuántos registros se excluyen del importe.

Aplicar con `npx prisma migrate deploy` y generar el cliente con
`npm run prisma:generate`, desde `backend`. Aplicada en la base de desarrollo el
22 de octubre de 2026, con confirmación del usuario.

## Resumen mensual

`GET /api/sessions/metrics` requiere sesión profesional y usa el negocio del
propietario autenticado. Consulta un intervalo acotado alrededor del mes local y
cuenta exclusivamente sesiones vinculadas a reservas completadas. La agrupación
usa `occurredAt` (fecha original de la reserva), incluyendo año, mes y día en la zona
horaria del negocio; no usa `createdAt` ni depende de la zona del navegador/servidor.
Excluye fechas futuras. Un registro tardío pertenece al mes en que ocurrió.

Devuelve atenciones de hoy y del mes, clientes únicos del mes, suma de valores
registrados, cantidad sin importe y todos los días del mes (incluidos ceros).
El panel actualiza al guardar una atención, al solicitarlo y al detectar el cambio
de fecha local (comprobado cada 30 segundos). Una falla conserva el último resumen
con una advertencia. La API de historial admite `limit` de 1 a 50 y mantiene el
valor predeterminado de 50 para otros consumidores.

## Verificación

- Backend: compilación y pruebas de permisos, paginación, idempotencia, precio
  guardado, límites del mes en Santiago, cambio de año, horario de verano, febrero
  bisiesto, clientes únicos y registros sin importe.
- Frontend: compilación y pruebas de tabla, cambio de página sin acumulación,
  recuperación de errores, ventana sin completar al cancelar, registro con imagen,
  reintento sin completar dos veces y actualización al cambiar de mes local.
- Revisión visual con los componentes reales y datos de ejemplo aislados de la API.
- 33 pruebas de backend y 40 de frontend aprobadas; compilaciones correctas.
  Comparación de las métricas con SQL independiente, solo lectura, sobre los dos
  negocios de desarrollo. Auditoría Axe sin incidencias en los estados revisados
  del panel, historial y ventanas; revisión de diseño en escritorio y móvil.

Referencias: [consultas de componentes Angular](https://angular.dev/guide/components/queries)
y [comportamiento del diálogo nativo](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
