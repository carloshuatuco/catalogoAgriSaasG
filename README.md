# Magistral SaaS - Catálogo Agrícola

Este es el proyecto independiente **Magistral SaaS**, movido y configurado para funcionar de manera autónoma.

## Características
- **Independiente**: Configuración aislada para evitar conflictos con otros proyectos.
- **Next.js 15+**: Framework de React para el frontend.
- **Firebase integration**: Autenticación, Firestore y Storage (con Long Polling habilitado por defecto para evitar problemas de firewall).
- **Puerto 3000**: Configurado para abrirse siempre en `localhost:3000`.

## Configuración y Ejecución

### 1. Variables de Entorno
Asegúrate de que el archivo `.env.local` contenga las credenciales correctas de Firebase.

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### 4. Producción
```bash
npm run build
npm start
```
