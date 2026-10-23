# Especificación de Producto: App "El Tercer Tiempo" (Gestión de Fulbito)

**Actúa como un Desarrollador Full-Stack Experto especializado en diseño UI/UX y vibecoding.**
Tu tarea es construir una aplicación web en React para gestionar la organización financiera y el armado de equipos de un partido de fútbol 7 semanal.

## 1. Stack Tecnológico y Diseño
*   **Framework:** React (aprovecha el entorno en el que estás corriendo).
*   **Estilos y UI:** Tailwind CSS. El diseño debe ser estrictamente moderno, minimalista, estilo SaaS utilitario (inspirado en la estética limpia de Vercel o Linear). Cero aspecto de "app de IA" (nada de gradientes saturados, sombras exageradas o bordes brillantes). Uso de mucho espacio en blanco, tipografía sans-serif limpia (Inter/Geist), y bordes sutiles.
*   **Estado:** Inicialmente simula el estado global de forma local de forma reactiva, preparado para una posterior integración con Firebase.
*   **Interacciones:** Lógica de Drag & Drop (arrastrar y soltar) para el armado de equipos.

## 2. Datos Iniciales (Jugadores y Saldos/Señas)
Carga por defecto la siguiente lista base de jugadores con sus señas previas (saldos a favor o en contra):
* Javi ($6.300), Alan ($0), Mono ($1.800), Javi mono ($200), Nardi ($500), Capi ($1.000), Maui ($0), Santi L ($-6.700), Marian ($0), Alessa ($600), Tío ($200), Balvi ($6.300), Steve ($7.800), Lori ($900), Gattu ($0), Juli ($1.800), Night ($600), Fierro ($1.900), Mati G ($-300), Marian 2 ($3.800).

## 3. Módulo 1: El Tercer Tiempo (Finanzas y Asistencia)
*   **Configuración del Partido:** Inputs numéricos globales para "Costo Total de la Cancha" y "Seña Previa Entregada".
*   **Lista de Gestión:** Una tabla o lista de tarjetas limpias donde cada jugador tiene:
    *   Checkbox: ¿Jugó hoy? (Por defecto, los primeros 14 marcados).
    *   Input numérico: ¿Cuánto pagó hoy?
    *   Toggle/Botón: Método de pago (Efectivo / MercadoPago).
    *   Checkbox: ¿Juega el próximo viernes?
*   **Acciones:** Botón "+ Agregar Invitado" para sumar un jugador temporal al listado.
*   **Cierre Inteligente:** Una tarjeta fija (tipo bottom bar o panel lateral) que calcule en tiempo real:
    1.  **Costo por persona:** (Costo total / cantidad de jugadores que jugaron).
    2.  **Arqueo de Caja:** Cuánto efectivo físico debe haber en mano y cuánto saldo en la cuenta de MercadoPago.
    3.  **Saldos actualizados:** El nuevo saldo de cada jugador para la próxima semana (Saldo anterior - Costo de hoy + Pagó hoy).
*   **Exportar a WhatsApp:** Un botón que genere un texto plano copiando al portapapeles: Una lista numerada con los que tildaron "Juega el próximo viernes", y debajo, una sección "Señas:" con los saldos actualizados distintos de cero.

## 4. Módulo 2: La Previa (Armado de Equipos)
*   **Origen de Datos:** Esta vista toma automáticamente a los jugadores que tienen tildado "Juega el próximo viernes" en el Módulo 1.
*   **Interfaz Drag & Drop:** Tres columnas minimalistas. Una central con los "Jugadores Disponibles", una izquierda "Equipo Azul" (máximo 7) y una derecha "Equipo Naranja" (máximo 7).
*   **Exportar Formaciones:**
    *   Botón 1: "Copiar Texto" (Genera formato: 🔵 Equipo Azul: [Nombres] vs 🟠 Equipo Naranja: [Nombres]).
    *   Botón 2: "Generar Imagen" (Captura la vista de los dos equipos en un formato vertical optimizado para celular, con diseño oscuro y elegante).

## 5. Instrucciones de Ejecución
*   Prioriza construir una interfaz funcional de una sola página (SPA) con pestañas limpias para cambiar entre "Finanzas" y "Equipos".
*   Asegúrate de que la lógica matemática del cierre de caja no tenga errores y se actualice en tiempo real.
