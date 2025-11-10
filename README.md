# Generador de historias interactivas

Aplicación full stack que permite crear salas en vivo para escribir relatos colaborativos tipo “cadáver exquisito”. Consta de dos paquetes:

- `client`: interfaz en React + Vite que maneja salas, participantes y envíos en tiempo real.
- `server`: API Express + Socket.IO que gestiona salas, segmentos y eventos websockets.

## Requisitos

- [Bun](https://bun.sh/) (v1.2 o superior) instalado globalmente.

## Primer inicio

```bash
cd Generador-de-historias-interactivas

# Instalar dependencias
cd client && bun install
cd ../server && bun install
```

## Ejecutar en desarrollo

En una terminal arranca el backend:

```bash
cd server
bun run dev      # levanta en http://localhost:4000
```

En otra terminal inicia el frontend:

```bash
cd client
bun dev          # abre la UI en http://localhost:5173
```

El cliente espera al servidor en `http://localhost:4000`. Puedes ajustar los puertos con las variables:

- `VITE_API_URL` y `VITE_SOCKET_URL` en el cliente (`.env`).
- `PORT`, `CLIENT_ORIGIN` y `MAX_SEGMENTS` en el servidor.

## Modo oscuro

- La interfaz recuerda automáticamente tu preferencia (botón “Modo oscuro / claro” en el encabezado).
- También respeta la preferencia del sistema la primera vez que visitas la app.

## Despliegue en GitHub Pages

1. Asegúrate de que la URL base de tu repo coincida (por defecto usamos `/Generador-de-historias-interactivas/`). Si tu repositorio tiene otro nombre, exporta `VITE_BASE_PATH=/tu-repo/` antes de construir.
2. Ejecuta:

   ```bash
   cd client
   bun run deploy
   ```

   Esto compila el frontend y publica el contenido de `dist/` en la rama `gh-pages` usando `gh-pages`.
3. Habilita GitHub Pages apuntando a la rama `gh-pages` (carpeta raíz).

> Recuerda que la UI seguirá esperando un backend Socket.IO disponible públicamente; despliega el servidor en tu servicio preferido y expón la URL mediante `VITE_API_URL` y `VITE_SOCKET_URL`.
