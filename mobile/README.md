# Caleiro — App Móvil

App React Native con Expo para la plataforma de cursos Caleiro.

## Requisitos

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode (Mac) o app **Expo Go** en tu iPhone
- Para Android: Android Studio o app **Expo Go** en tu teléfono

## Instalación

```bash
cd mobile
npm install
```

## Configurar la URL de la API

Edita [src/api/client.js](src/api/client.js) y cambia `BASE_URL`:

```js
// Desarrollo local (con el backend corriendo en tu PC)
export const BASE_URL = "http://TU_IP_LOCAL:80/api";

// Producción
export const BASE_URL = "https://caleiro.online/api";
```

> Para encontrar tu IP local en Windows: ejecuta `ipconfig` en la terminal.

## Ejecutar

```bash
# Escáner QR para usar con Expo Go (más rápido)
npm start

# Android (emulador o USB)
npm run android

# iOS (simulador Mac)
npm run ios
```

## Estructura

```
mobile/
├── App.js                    # Punto de entrada
├── app.json                  # Configuración Expo
├── src/
│   ├── api/
│   │   └── client.js         # Helper HTTP con token JWT
│   ├── context/
│   │   ├── AuthContext.js    # Login, register, logout, estado de usuario
│   │   └── ThemeContext.js   # Colores oscuro/claro + toggle
│   ├── navigation/
│   │   └── AppNavigator.js   # Stack + Bottom Tabs navigation
│   └── screens/
│       ├── LoginScreen.js        # Inicio de sesión
│       ├── RegisterScreen.js     # Registro de cuenta
│       ├── CoursesScreen.js      # Catálogo de cursos con búsqueda
│       ├── CourseDetailScreen.js # Detalle + inscripción
│       ├── MyCoursesScreen.js    # Mis cursos con progreso
│       ├── LessonViewScreen.js   # Reproductor + lecciones secuenciales + calificación
│       ├── ProfileScreen.js      # Perfil, contraseña, tema
│       └── CertificateScreen.js  # Certificado visual + compartir
```

## Funcionalidades

| Feature | Pantalla |
|---|---|
| Login / Registro | LoginScreen, RegisterScreen |
| Catálogo de cursos con búsqueda | CoursesScreen |
| Detalle de curso + inscripción | CourseDetailScreen |
| Mis cursos con barra de progreso | MyCoursesScreen |
| Video player (YouTube, Vimeo, Firebase) | LessonViewScreen |
| Lecciones bloqueadas hasta completar video | LessonViewScreen |
| Calificación ⭐ + comentario obligatorio | LessonViewScreen (modal) |
| Certificado visual + compartir | CertificateScreen |
| Cambio de contraseña | ProfileScreen |
| Toggle tema Oscuro / Claro | ProfileScreen |

## Generar APK / IPA para producción

```bash
# Instalar EAS CLI
npm install -g eas-cli
eas login

# Configurar proyecto
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```
