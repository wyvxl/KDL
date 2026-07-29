# KITS — Gestión de pedidos de panadería

Sistema de gestión para una panadería: catálogo de productos, clientes, toma de pedidos
y control de inventario. Proyecto académico centrado en la capa de base de datos: toda la
lógica de negocio vive en paquetes y procedimientos PL/SQL, y el backend solo los invoca.

## Stack

| Capa | Tecnología |
|---|---|
| Base de datos | Oracle (probado sobre Oracle Database Free) |
| Backend | Java 21 · Spring Boot 4.1 · Gradle · JDBC sobre `ojdbc11` |
| Frontend | React 19 · TypeScript · Vite |
| Autenticación | JWT (`jjwt`), stateless |

## Estructura

```
KITS_BACKEND/
  Scripts BD/        Scripts numerados: se ejecutan en orden 01 → 12
  src/main/java/org/kits/
    bl/              Lógica de negocio: una clase por entidad, invoca los paquetes PL/SQL
    controllers/     Endpoints REST
    db/              Conexión y ejecución de procedimientos almacenados
    dto/ entities/   Modelos de datos
    security/        Filtro JWT y reglas de autorización
KITS_FRONTEND/
  src/
    pages/           Una carpeta por módulo (dashboard, orders, products, clients, users)
    components/      Modales y elementos de interfaz reutilizables
    services/        Cliente HTTP por entidad
    utils/           Permisos y manejo de errores
```

## Puesta en marcha

### 1. Base de datos

Ejecutar los scripts de `KITS_BACKEND/Scripts BD/` **en orden numérico**. El script 01 crea
el usuario `KITS` y necesita una sesión con privilegios de administrador; el resto se
ejecuta como `KITS`.

> El script 12 carga datos de prueba y **borra todos los datos existentes** antes. Es
> reejecutable a propósito: sirve para volver a un estado conocido cuantas veces haga falta.

### 2. Backend

```bash
cd KITS_BACKEND
./gradlew bootRun
```

Queda en `http://localhost:8080`. La conexión se configura en
`src/main/resources/application.properties`; `JWT_SECRET` y `CORS_ALLOWED_ORIGIN` se pueden
sobrescribir por variable de entorno.

La aplicación **no arranca sin la base de datos**: la conexión se valida al construir los
beans. Por el mismo motivo, para empaquetar sin una instancia disponible:

```bash
./gradlew build -x test
```

### 3. Frontend

```bash
cd KITS_FRONTEND
npm install
npm run dev
```

Queda en `http://localhost:5173`. La URL del backend se puede cambiar con `VITE_API_URL`.

### Usuarios de prueba

Los crea el script 12, todos con contraseña `1234`: `admin`, `vendedor`, `panadero`,
`repartidor`.

## Roles

La autorización se resuelve por **nombre** de rol, no por id: los ids de `ROLES` son
`GENERATED ALWAYS AS IDENTITY` y se desplazan al recargar los datos.

| Rol | Pedidos | Clientes | Productos | Usuarios |
|---|---|---|---|---|
| `ADMIN` | todo | todo | todo | todo |
| `VENDEDOR` | crear, editar, cobrar, cancelar | todo | consulta | — |
| `PANADERO` | consultar y avanzar estado | — | todo | — |
| `REPARTIDOR` | consultar y avanzar estado | — | — | — |

Las reglas están en `security/SecurityConfig.java`. Los permisos que decide qué ve el
usuario en pantalla los calcula `LUsuario.obtenerPermisosPorRol`; ambas listas se mantienen
a mano y deben ir alineadas.

## Cómo funciona el inventario

Es la parte menos obvia del dominio y conviene entenderla antes de tocar pedidos.

El pan no está listo al instante: un pedido puede ser para hoy, para mañana o para la
semana que viene. Por eso **el stock no se descuenta al registrar el pedido, sino cuando
cocina lo toma** (`PENDIENTE` → `EN_PROCESO`). Así el descuento ocurre siempre contra el
inventario que existe el día en que se prepara, sin importar la fecha del pedido.

```
Vendedor registra  →  PENDIENTE     no toca el inventario, solo compromete
Cocina lo toma     →  EN_PROCESO    ← aquí sale del inventario
                      LISTO → ENTREGADO
Se cancela         →  CANCELADO     devuelve lo que ya hubiera salido
```

Invariante: `PEDIDOS.stock_aplicado = 'S'` ⟺ estado en (`EN_PROCESO`, `LISTO`,
`ENTREGADO`). La columna hace que aplicar y revertir sean idempotentes.

Consecuencias prácticas:

- **Un pedido solo se puede editar mientras esté `PENDIENTE`.** Después sus productos ya
  salieron del inventario y cambiar las líneas lo descuadraría.
- **Al tomar el pedido se muestra la disponibilidad**, no se bloquea:
  `disponible = stock_actual − comprometido en pedidos pendientes`. Para una fecha futura
  superarla es normal, se hornea ese día.
- **Cocina tiene un parte de producción** por fecha (`sp_produccion_requerida`), que agrupa
  por producto lo que hay que tener listo y cuánto falta hornear.
- La reposición por producción entra como movimiento `ENTRADA` en el ajuste de stock.

## Nota sobre seguridad

Es un proyecto académico. Las contraseñas se guardan en texto plano, las credenciales de
la base están en el `application.properties` y el script 01 concede privilegios amplios al
usuario `KITS`. Son decisiones deliberadas para el alcance del curso, no descuidos.
