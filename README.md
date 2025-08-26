# NEXO Web App

## 📝 Descripción del Proyecto

NEXO Web App es un sistema de gestión de checklists y reportes diseñado para optimizar la inspección y el control de máquinas. La aplicación permite a los usuarios (inspectores y administradores) realizar inspecciones detalladas, generar reportes personalizados con filtros y exportar los datos en diferentes formatos (PDF y CSV).

Este proyecto utiliza la tecnología **Next.js** para el frontend y **Supabase** como backend sin servidor (serverless) para la base de datos y la autenticación.

---

### ✨ Características Principales

-   **Autenticación de Usuarios**: Roles de `superadmin`, `administrador` e `inspector`.
-   **Creación de Checklists**: Permite definir diferentes tipos de checklists y sus ítems asociados.
-   **Gestión de Máquinas**: Catálogo para el registro y control de máquinas.
-   **Generación de Reportes**: Reportes detallados con filtros por fecha, tipo de máquina y código.
-   **Exportación de Datos**: Funcionalidades para exportar reportes a **PDF** (vista optimizada para impresión) y **CSV** (con datos brutos y pivotados).

---

### 🛠️ Requisitos

Para ejecutar este proyecto de forma local, necesitas tener instalado:

-   **Node.js** (versión 18 o superior recomendada)
-   **npm** o **Yarn**

---

### 🚀 Instalación y Uso

1.  **Clonar el repositorio**:
    ```bash
    git clone [https://github.com/rodrigoNXCL/inn_web.git](https://github.com/rodrigoNXCL/inn_web.git)
    cd inn_web
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    # o si usas yarn:
    # yarn install
    ```

3.  **Configurar Supabase**:
    * Crea un archivo `.env.local` en la raíz del proyecto.
    * Añade tus credenciales de Supabase. Puedes encontrarlas en `Settings -> API` en el panel de control de tu proyecto Supabase.
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu-url-de-proyecto-supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
    ```

4.  **Ejecutar la aplicación**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

### 📂 Estructura del Proyecto

-   `pages/`: Rutas de la aplicación.
    -   `_app.tsx`: Componente principal que envuelve toda la aplicación.
    -   `login.tsx`: Página de inicio de sesión.
    -   `reportes/`: Subrutas relacionadas con los reportes.
-   `components/`: Componentes reutilizables como el `Layout`, formularios, etc.
-   `styles/`: Archivos de estilo CSS.
-   `lib/`: Archivos de configuración, como la conexión a Supabase.
-   `public/`: Archivos estáticos como el logo de la empresa.

---

### 📧 Contacto y Soporte

Si tienes preguntas o necesitas soporte, puedes contactar a:

-   **Correo electrónico**: [soporte@nxchile.com](mailto:soporte@nxchile.com)
-   **WhatsApp**: [+56 9 7741 2178](https://wa.me/56977412178)