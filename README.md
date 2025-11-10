# Generador de Historias Interactivas 🎭

Una aplicación web de colaboración en tiempo real que permite a múltiples usuarios crear historias colaborativas utilizando la técnica del "cadáver exquisito". Los participantes agregan contribuciones a la historia uno por uno, pero solo pueden ver la última contribución, manteniendo el misterio hasta que la historia se completa.

## Características ✨

- **Colaboración en Tiempo Real**: Múltiples usuarios pueden participar en una historia simultáneamente
- **Estilo Cadáver Exquisito**: Solo se muestra la última contribución para mantener el suspenso
- **WebSockets**: Comunicación bidireccional en tiempo real usando Socket.IO
- **Frontend Moderno**: Interfaz React con Vite para una experiencia rápida y reactiva
- **Backend Simple**: Servidor Node.js/Express eficiente con almacenamiento en memoria

## Tecnologías 🛠️

### Frontend
- React 18
- Vite
- Socket.IO Client
- CSS moderno con efectos de glassmorphism

### Backend
- Node.js
- Express 5
- Socket.IO
- CORS

## Estructura del Proyecto 📁

```
Generador-de-historias-interactivas/
├── backend/           # Servidor Node.js/Express
│   ├── index.js      # Archivo principal del servidor
│   └── package.json
└── frontend/          # Aplicación React/Vite
    ├── src/
    │   ├── components/
    │   │   ├── CreateStory.jsx
    │   │   ├── StoryList.jsx
    │   │   └── StoryRoom.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Instalación 🚀

### Requisitos Previos
- Node.js (versión 18 o superior)
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Duver0/Generador-de-historias-interactivas.git
cd Generador-de-historias-interactivas
```

### 2. Instalar Backend
```bash
cd backend
npm install
```

### 3. Instalar Frontend
```bash
cd ../frontend
npm install
```

## Uso 💻

### Iniciar el Backend
```bash
cd backend
npm start
```
El servidor estará disponible en `http://localhost:3001`

### Iniciar el Frontend
En otra terminal:
```bash
cd frontend
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

## Cómo Funciona 🎯

### 1. Ingresar tu Nombre
Al abrir la aplicación, primero debes ingresar tu nombre de usuario.

### 2. Crear o Unirse a una Historia
- **Crear Nueva Historia**: Haz clic en "Crear Nueva Historia" y dale un título
- **Unirse a Historia Existente**: Selecciona una historia activa de la lista

### 3. Contribuir a la Historia
- Solo puedes ver la última contribución realizada (estilo cadáver exquisito)
- Escribe tu contribución en el área de texto
- Haz clic en "Agregar a la Historia"

### 4. Finalizar la Historia
- Cualquier participante puede finalizar la historia
- Al finalizar, se revela la historia completa con todas las contribuciones

### 5. Ver Historia Completa
- Durante la sesión, puedes hacer clic en "Ver Historia Completa" para revelar todo el texto
- Las historias finalizadas muestran automáticamente el texto completo

## Características de la Aplicación 🎨

### Notificaciones en Tiempo Real
- Cuando un usuario se une
- Cuando se agrega una nueva contribución
- Cuando un usuario sale
- Cuando la historia finaliza

### Panel de Participantes
- Muestra todos los usuarios conectados actualmente
- Se actualiza en tiempo real

### Estados de Historia
- **Activa**: Las historias en progreso donde puedes contribuir
- **Finalizada**: Historias completadas que puedes leer

## API REST Endpoints 📡

### `GET /api/health`
Verifica el estado del servidor
```json
{
  "status": "ok",
  "stories": 5
}
```

### `GET /api/stories`
Obtiene la lista de todas las historias
```json
[
  {
    "id": "1234567890",
    "title": "La aventura del bosque",
    "createdBy": "Juan",
    "participants": 3,
    "contributions": 12,
    "isActive": true,
    "createdAt": "2025-11-10T00:00:00.000Z"
  }
]
```

### `POST /api/stories`
Crea una nueva historia
```json
{
  "title": "Mi nueva historia",
  "userName": "María"
}
```

### `GET /api/stories/:id`
Obtiene información detallada de una historia específica

## Eventos WebSocket 🔌

### Cliente → Servidor
- `join-story`: Unirse a una historia
- `add-contribution`: Agregar una contribución
- `get-full-story`: Solicitar la historia completa
- `end-story`: Finalizar una historia

### Servidor → Cliente
- `story-state`: Estado inicial de la historia
- `new-contribution`: Nueva contribución agregada
- `participant-joined`: Nuevo participante
- `participant-left`: Participante se fue
- `story-ended`: Historia finalizada
- `full-story`: Historia completa revelada
- `error`: Error del servidor

## Desarrollo 🔧

### Modo Desarrollo Frontend
```bash
cd frontend
npm run dev
```
Hot Module Replacement (HMR) habilitado para desarrollo rápido.

### Construcción para Producción
```bash
cd frontend
npm run build
```
Los archivos optimizados se generarán en `frontend/dist/`

### Linting
```bash
cd frontend
npm run lint
```

## Configuración Avanzada ⚙️

### Cambiar Puerto del Backend
Edita `backend/index.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

### Cambiar URL del Backend en Frontend
Edita `frontend/src/App.jsx`:
```javascript
const SOCKET_URL = 'http://localhost:3001';
```

## Mejoras Futuras 🚀

- [ ] Persistencia de datos con base de datos (MongoDB, PostgreSQL)
- [ ] Autenticación de usuarios
- [ ] Sala privadas con códigos de acceso
- [ ] Exportar historias como PDF o texto
- [ ] Configuración de tiempo límite por contribución
- [ ] Categorías de historias
- [ ] Sistema de reacciones a contribuciones
- [ ] Modo oscuro/claro
- [ ] Internacionalización (i18n)
- [ ] Límite de caracteres configurable

## Limitaciones Actuales ⚠️

- **Almacenamiento en Memoria**: Las historias se pierden al reiniciar el servidor
- **Sin Autenticación**: No hay sistema de usuarios persistente
- **Escalabilidad Limitada**: No está optimizado para grandes cantidades de usuarios simultáneos
- **Sin Persistencia**: No hay base de datos configurada

## Solución de Problemas 🔍

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo en `http://localhost:3001`
- Revisa la configuración de CORS en `backend/index.js`
- Asegúrate de que no haya otros servicios usando el puerto 3001

### Los cambios en tiempo real no funcionan
- Verifica la consola del navegador para errores de WebSocket
- Asegúrate de que Socket.IO esté instalado correctamente en ambos lados
- Revisa los logs del servidor para errores de conexión

## Contribuir 🤝

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia 📄

Este proyecto es de código abierto y está disponible bajo la licencia ISC.

## Autor ✍️

Creado para facilitar la creación colaborativa de historias en tiempo real.

## Agradecimientos 🙏

- Inspirado en el juego surrealista del "Cadáver Exquisito"
- Construido con las mejores herramientas modernas de desarrollo web
