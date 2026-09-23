# Despliegue en línea (gratis)

| Pieza | Dónde | Plan |
|---|---|---|
| Base de datos | Oracle Cloud — Autonomous Database | Always Free |
| Backend (Spring Boot) | Render — Web Service con Docker | Free |
| Frontend (React) | GitHub Pages | Gratis (repo público) |

Orden recomendado: **1 → 2 → 3 → 4**. Los nombres de botones pueden variar un poco si las consolas cambian.

---

## 1. Base de datos en Oracle Cloud

**Crear la cuenta:** <https://signup.cloud.oracle.com/>
Pide tarjeta solo para verificar identidad; lo marcado *Always Free* no se cobra. Elige una región cercana (por ejemplo *US East (Ashburn)*); no se puede cambiar después.

**Crear la base:**
1. Menú ☰ → **Oracle Database → Autonomous Database → Create Autonomous Database**.
2. Nombre: `kitsdb`. Tipo de carga: **Transaction Processing**.
3. Activa **Always Free**.
4. Define la contraseña de `ADMIN` y guárdala.
5. Acceso de red: por ahora **Secure access from everywhere**. Se restringe en el paso 3.

**Cargar el esquema:**
1. En la base → **Database Actions → SQL**, conectado como `ADMIN`.
2. Abre `KITS_BACKEND/Scripts BD/01b Usuario Autonomous.sql`, **cambia la contraseña** y ejecútalo como script (F5). Esa contraseña es la de `DB_PASSWORD`.
3. Cierra sesión y entra a Database Actions como `KITS` (la URL cambia a `.../ords/kits/...`).
4. Ejecuta los scripts `02` a `12` en orden, cada uno como script (F5).

> ⚠️ El script 12 crea `admin`, `vendedor`, `panadero` y `repartidor` con contraseña `1234`. Con la app en internet, **cambia esas contraseñas apenas entres** (menú 🔑 y pantalla Usuarios), o edita el script antes de correrlo.

---

## 2. Backend en Render

**Crear la cuenta:** <https://dashboard.render.com/register> (entra con tu cuenta de GitHub).

1. **New → Blueprint** (<https://dashboard.render.com/blueprints>) y elige el repo `wyvxl/KDL`. Render lee `render.yaml` y crea el servicio `kits-backend`.
2. Te pedirá tres valores:
   - `DB_USERNAME`: `KITS`
   - `DB_PASSWORD`: la contraseña del script 01b
   - `DB_URL`: déjalo en `pendiente` por ahora; se completa en el paso 3.
3. Cuando termine, la URL será algo como `https://kits-backend.onrender.com`. Anótala.

El primer despliegue va a fallar porque todavía no hay conexión con la base. Es normal.

`JWT_SECRET` lo genera Render solo; no hace falta tocarlo.

---

## 3. Conectar Render con la base (TLS sin wallet)

1. En Render → servicio `kits-backend` → **Connect → Outbound**: copia los rangos de IP de salida.
2. En Oracle → tu base → **Network → Access control list → Edit**:
   - agrega los rangos de Render,
   - agrega también **tu IP** (botón *Add my IP address*) para seguir usando Database Actions.
3. En la misma sección, **Mutual TLS (mTLS) authentication → Edit → desmarcar "Require mutual TLS"**.
4. **Database connection** → *TLS authentication: TLS* → copia la cadena de `kitsdb_low`. Empieza con `(description=`.
5. En Render → **Environment** → `DB_URL` =
   `jdbc:oracle:thin:@` + la cadena copiada, todo en una línea.
6. **Manual Deploy → Deploy latest commit**. Cuando termine, abre
   `https://kits-backend.onrender.com/health`: debe decir `"database":"CONNECTED"`.

---

## 4. Frontend en GitHub Pages

GitHub Pages en repos privados requiere un plan pago; con el repo **público** es gratis.

1. **Hacer público el repo:** <https://github.com/wyvxl/KDL/settings> → *Danger Zone → Change visibility → Public*.
2. **Activar Pages:** <https://github.com/wyvxl/KDL/settings/pages> → *Source: **GitHub Actions***.
3. **Variable con la URL del backend:** <https://github.com/wyvxl/KDL/settings/variables/actions> → *New repository variable*
   - Nombre: `VITE_API_URL`
   - Valor: la URL de Render, sin `/` al final (p. ej. `https://kits-backend.onrender.com`).
4. **Actions → Desplegar frontend → Run workflow** (<https://github.com/wyvxl/KDL/actions>).
   Desde entonces se publica solo en cada push a `master` que toque el frontend.

La app queda en **<https://wyvxl.github.io/KDL/>**.

---

## Límites del plan gratis

- **Render** duerme el backend tras ~15 min sin uso: la primera petición después tarda cerca de un minuto. El login puede parecer colgado mientras despierta.
- **Autonomous Always Free** se detiene tras unos días sin actividad. Se vuelve a encender desde la consola (**More actions → Start**). Si queda detenida mucho tiempo, Oracle puede reclamarla: revisa sus condiciones actuales.
- Render guarda las variables de entorno fuera del repo: nada de esto queda en GitHub.

## Variables del backend

| Variable | Para qué | Local (por defecto) |
|---|---|---|
| `DB_URL` | Cadena JDBC | `jdbc:oracle:thin:@//localhost:1521/FREE` |
| `DB_USERNAME` / `DB_PASSWORD` | Usuario de la base | `KITS` / `Kits2025` |
| `DB_POOL_SIZE` | Conexiones máximas | `10` (Render: `5`) |
| `JWT_SECRET` | Firma de los tokens | valor de desarrollo |
| `CORS_ALLOWED_ORIGIN` | Origen del frontend | `http://localhost:5173` |
| `PORT` | Puerto HTTP (lo pone Render) | `8080` |
