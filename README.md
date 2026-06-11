# Quiniela Mundial API 🏆

Backend para la gestión de una quiniela del mundial. Construido utilizando **Node.js**, **Express**, **TypeScript** y siguiendo los principios de la **Arquitectura Hexagonal**.

## 🚀 Tecnologías

* **Lenguaje:** TypeScript
* **Framework Web:** Express.js
* **Base de Datos:** PostgreSQL
* **ORM:** Drizzle ORM
* **Autenticación:** JWT (JSON Web Tokens) & bcryptjs
* **Validaciones:** Zod
* **Documentación:** Swagger (OpenAPI)

## 📁 Arquitectura del Proyecto

El proyecto está diseñado bajo el patrón de **Arquitectura Hexagonal** (Puertos y Adaptadores), asegurando un bajo acoplamiento y alta cohesión, dividiendo el código en capas:

* **API / Presentation (`src/api`):** Controladores, rutas (Express), middlewares y configuración de Swagger.
* **Application / Domain:** Casos de uso, lógica de negocio e interfaces (puertos).
* **Infrastructure (`src/infrastructure`):** Implementaciones concretas como la conexión a la base de datos (PostgreSQL), repositorios con Drizzle ORM, etc.

## 🛠️ Requisitos Previos

Asegúrate de tener instalado en tu sistema:
* [Node.js](https://nodejs.org/) (v18 o superior recomendado)
* [PostgreSQL](https://www.postgresql.org/)

## ⚙️ Instalación y Configuración Local

1. **Clona el repositorio** e instala las dependencias:
   ```bash
   npm install
   ```

2. **Configura las variables de entorno:**
   Copia el archivo de ejemplo y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` y ajusta los valores según tu configuración local, especialmente los datos de conexión a la base de datos PostgreSQL (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, etc.).

3. **Base de Datos (Drizzle ORM):**
   Genera y aplica las migraciones a tu base de datos:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
   *(Opcional)* Si tienes un archivo seed para poblar datos iniciales:
   ```bash
   npm run db:seed
   ```

## 🏃‍♂️ Ejecución del Proyecto

### Modo Desarrollo (con recarga automática)
```bash
npm run dev
```

### Modo Producción
Primero debes compilar el código de TypeScript a JavaScript y luego iniciarlo:
```bash
npm run build
npm start
```

## 📚 Documentación de la API (Swagger)

Una vez que el servidor esté corriendo, puedes acceder a la documentación interactiva de los endpoints generada con Swagger ingresando en tu navegador a:

👉 **http://localhost:3000/api/docs**

---
Desarrollado con ❤️ para vivir la pasión del mundial.
