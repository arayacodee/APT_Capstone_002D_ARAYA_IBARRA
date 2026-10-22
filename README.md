# APT_Capstone_002D_ARAYA_IBARRA

Proyecto CRONOS de Manuel Araya y Martin Ibarra, sección 002D.

Plataforma de reservas para clientes y profesionales. Frontend Angular; API Express y TypeScript; PostgreSQL en Neon mediante Prisma; autenticación Google y sesión JWT en cookie HttpOnly; imágenes en Cloudinary.

## Carpeta académica

Las evidencias se organizan por fase. Fase 2 separa evidencias individuales, grupales y del proyecto según la referencia del curso.

| Carpeta | Contenido |
| --- | --- |
| [Fase 1](Fase%201/README.md) | Estructura de la entrega, guía de definición del proyecto y pendientes por integrante |
| [Fase 2](Fase%202/README.md) | Individuales, avance, informe final y evidencias del proyecto |
| [Fichas de iteración](Fase%202/Evidencias%20Proyecto/Fichas_Iteracion/README.md) | Fichas 02 y 04 disponibles; 01 y 03 pendientes |

Los documentos individuales pendientes se indican en los índices; esos avisos no cuentan como evidencias entregadas.

## Desarrollo local

Con las dependencias y `backend/.env` configurados, ejecutar en terminales separadas:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm start
```

Frontend: http://localhost:4200. Backend: http://localhost:3000. La URL de la API y el identificador público de Google se configuran en `frontend/src/environments/environment.ts`. Los secretos permanecen en `backend/.env`.

## Roles y reservas

Los perfiles permiten elegir Servicios generales (predeterminado), Bienestar y terapias o Belleza y cuidado personal. Al crear o editar el perfil se puede publicar el nombre del profesional o terapeuta, especialidades, dirección y modalidad de atención. El inicio filtra por categoría y el perfil público, las reservas y el panel adaptan su vocabulario. Bienestar muestra terapias, citas, pacientes e historial de sesiones y oculta el portafolio de trabajos. Las notas e imágenes del historial continúan privadas. El superadmin puede editar el tipo y los campos públicos. La migración conserva los negocios existentes como Servicios generales, con los campos nuevos vacíos.

- `CLIENT`: explora negocios, reserva horarios y consulta o cancela sus reservas pendientes o confirmadas.
- `PROFESSIONAL`: gestiona su negocio, servicios y disponibilidad; registra atenciones y consulta su historial.
- `SUPERADMIN`: accede a `/admin` para consultar datos de todos los negocios y editar nombres y roles de usuarios, perfiles de negocios, servicios, horarios, notas de atenciones y descripciones de evidencias. Puede habilitar clientes/profesionales y cancelar o completar reservas respetando sus estados. El panel no cambia correos, vínculos Google, relaciones entre registros ni el rol de los superadmins.

## Habilitar la cuenta compartida de administración

El panel ofrece eliminación permanente con confirmación para usuarios (excepto superadmins), negocios, servicios, horarios, reservas, atenciones y evidencias. Borrar un usuario incluye sus negocios y reservas como cliente; borrar un negocio o servicio incluye sus reservas e historial. Borrar una atención elimina también su reserva vinculada. Horarios y evidencias se eliminan individualmente. Las cuentas de otros usuarios se conservan. Un usuario eliminado puede volver a registrarse con Google como cliente nuevo; eliminar no equivale a bloquearlo. Las eliminaciones de datos se realizan en una transacción serializable, sin migraciones adicionales. Las imágenes se limpian en Cloudinary después del commit; si falla la limpieza, el panel muestra una advertencia y el servidor registra los identificadores pendientes para revisión.

La cuenta compartida ingresa por `/admin/login` con el identificador `superadmin@cronos` y la contraseña: cronos123. Este identificador no es un buzón de correo ni necesita Google. Las cuentas personales de los profesionales mantienen su rol y negocio.

En `backend`, ejecutar `npm run admin:configure` e ingresar la contraseña elegida. Guarda `SUPERADMIN_LOGIN` y `SUPERADMIN_PASSWORD_HASH` en el `.env` local, con sal aleatoria y scrypt; nunca escribe la contraseña en el código ni en la base de datos. Este archivo no se versiona. Cada PC que ejecute su propio backend debe configurar el mismo usuario y contraseña (los hashes pueden ser distintos).

Una vez confirmado que `DATABASE_URL` corresponde a la base de desarrollo, aplicar las migraciones con `npx prisma migrate deploy`, generar el cliente con `npm run prisma:generate` y ejecutar:

```powershell
npm run admin:provision
```

El comando crea la cuenta compartida y es idempotente. Rechaza identificadores de cuentas con Google o con otro rol. No modifica las cuentas personales. Reiniciar el backend tras cambiar `.env`. El acceso devuelve un error si falta el hash o la cuenta todavía no está habilitada. El servidor limita los intentos a diez por IP cada quince minutos en cada proceso y utiliza la misma cookie HttpOnly de sesión que el resto de la aplicación. Si el backend está detrás de un proxy, configurar su topología de confianza antes de ajustar este límite; no confiar indiscriminadamente en cabeceras reenviadas.

Las elevaciones a superadmin solo se realizan con el comando de servidor, nunca desde el registro público ni desde el panel. Las acciones de la cuenta compartida se atribuyen al mismo usuario, sin distinguir cuál de sus operadores ingresó.

- Una reserva confirmada puede completarse desde su hora de inicio. Completar crea una única atención; la fecha de atención corresponde al inicio de la reserva y `createdAt` registra cuándo se ingresó al sistema.
- Las reservas completadas no pueden cancelarse. Repetir una cancelación o completar una reserva ya atendida devuelve el resultado existente.
- La creación de reservas usa aislamiento serializable y reintentos; completar y cancelar usan actualizaciones condicionales dentro de transacciones.
- Las fechas se muestran en la zona horaria del negocio. El dashboard actualiza las listas al pasar el tiempo.

## Historial de atenciones

En **Editar perfil** se pueden reemplazar o eliminar la foto de perfil y la portada. También se puede cancelar una selección antes de subirla. Eliminar limpia la referencia del negocio y solicita la eliminación en Cloudinary; si Cloudinary falla, se registra el fallo y el perfil queda sin imagen. La vitrina del inicio presenta fotos cuadradas en tarjetas de hasta 280 píxeles de ancho.

Desde el panel profesional, abrir **Historial de atenciones** (`/dashboard/history`). Permite consultar atenciones, editar notas de hasta 1500 caracteres y agregar imágenes JPEG, PNG o WebP de hasta 5 MB, con descripción opcional de hasta 300 caracteres. Cada imagen puede abrirse o eliminarse.

La API requiere sesión profesional y restringe todas las operaciones al negocio del usuario:

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/api/sessions?cursor=...&clientId=...` | Historial, 50 elementos por página; devuelve `items` y `nextCursor` |
| PATCH | `/api/sessions/:id` | Editar `notes` |
| POST | `/api/sessions/:id/evidences` | Agregar `image` y `caption` mediante multipart |
| DELETE | `/api/sessions/evidences/:id` | Eliminar imagen de Cloudinary y su referencia |

Si falla el registro de una imagen en la base, la API intenta limpiar la subida en Cloudinary. Las evidencias no se muestran en el perfil público del negocio.

## Verificación

### Galería pública del negocio

Todas las categorías incluyen **Fotos del negocio** en el perfil público. Desde **Editar perfil** se pueden subir hasta 30 imágenes JPEG, PNG o WebP de hasta 5 MB, con descripción opcional de hasta 300 caracteres, y eliminarlas. Solo el propietario autenticado puede modificarlas. Son independientes de las evidencias privadas del historial. Al borrar un negocio o su propietario, se eliminan los registros de fotos y se solicita su limpieza en Cloudinary.

```powershell
cd backend
npm run build
npm test
```

```powershell
cd frontend
npm run build
npm test -- --watch=false
```

Las pruebas cubren estados de reservas, permisos del historial, sesión, consultas de horarios, zona horaria, reloj del dashboard y edición y paginación del historial. Usan datos simulados: no escriben en Neon ni suben imágenes a Cloudinary. Las cargas reales de imágenes y la concurrencia real en PostgreSQL requieren pruebas de integración en la rama Neon de desarrollo.

## Colaboración

## Datos de contacto y registro de empresas

`/login` permite elegir iniciar sesión con correo y contraseña, o registrarse con nombre, apellido, correo, contraseña (mínimo 8 caracteres), teléfono y dirección. Las contraseñas se guardan como hashes scrypt con sal aleatoria. El registro crea un cliente y nunca acepta roles desde el navegador. El teléfono se guarda como texto sin verificar su existencia ni exigir SMS. Los datos de contacto son privados.

Las cuentas anteriores de Google conservan sus datos y permisos. El superadmin puede crear o reemplazar su contraseña mediante **Usuarios → Cambiar contraseña**, con confirmación y mínimo 8 caracteres. Este endpoint requiere superadmin, guarda únicamente un hash y protege las cuentas de administración (su acceso se configura mediante `.env`). Se retiró la creación de contraseña desde Mis datos y su endpoint. La recuperación de contraseñas por correo queda pendiente.

`/companies` presenta una suscripción de **$7.900 CLP mensuales** y permite guardar una solicitud de empresa. En desarrollo, **Crear perfil sin pago · prueba** activa el rol profesional y crea el negocio desde la solicitud guardada, dentro de una transacción; si ya existe el negocio, lo conserva. Abre el dashboard con la sesión actualizada. Esta activación no cobra ni registra una suscripción pagada y está bloqueada cuando `NODE_ENV=production`. La integración real de Webpay y la activación tras pago confirmado quedan pendientes.

### Trabajo en equipo

Una tarea por rama, cambios mediante Pull Request y compilación de ambos proyectos antes del PR. No desarrollar en `main`, no versionar credenciales ni usar Neon `production` para desarrollo. Si cambia `schema.prisma`, incluir la migración correspondiente.
