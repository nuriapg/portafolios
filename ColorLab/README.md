# ColorLab

Un pequeño estudio de color interactivo construido con **React, TypeScript y CSS**. Genera una paleta y comprueba inmediatamente cómo funciona en botones, tarjetas, formularios, fondos y tipografía.

## Funcionalidades

- Generación de cinco colores con roles: fondo, superficie, acento, primario y texto.
- Edición mediante selector de color o código hexadecimal (formatos `#RGB` y `#RRGGBB`).
- Bloqueo individual: los colores bloqueados se conservan al generar. El bloqueo permite seguir editando el color manualmente.
- Generación con la barra espaciadora, sin interferir con formularios, botones o diálogos.
- Vista de muestra interactiva, con colores compartidos mediante variables CSS.
- Contraste WCAG 2.2 para cualquier pareja de colores de la paleta, con niveles AA y AAA para texto normal y grande.
- Exportación de variables CSS, incluyendo los colores de texto utilizados sobre los botones.
- Hasta 60 favoritas en `localStorage`, sin duplicados; aplicar, eliminar y deshacer una eliminación.
- Manejo de almacenamiento no disponible, datos dañados y portapapeles bloqueado.
- Adaptación a pantallas pequeñas, controles con nombre accesible, foco visible y movimiento reducido.

No hay API, base de datos, cuentas de aplicación ni envío de formularios a un servidor. La muestra del formulario solo muestra una respuesta local. Las favoritas pertenecen al navegador y al dominio: no se sincronizan entre dispositivos y se pierden si se borran los datos del sitio.

## Ejecutar

Requiere Node.js **22.18 o posterior** y npm.

```bash
npm ci
npm run dev
```

Abre la dirección que indique la consola.

```bash
npm test
npm run typecheck
npm run build
```

Esta carpeta es una aplicación independiente de **Vite + React + TypeScript**. La compilación genera archivos estáticos en `dist/`; puedes servirlos desde cualquier alojamiento estático. No contiene configuración de cuentas ni servicios externos. La vista publicada originalmente tiene acceso privado; este repositorio contiene el código para ejecutar y publicar tu propia copia.

Para instalarla desde este repositorio:

```bash
git clone https://github.com/nuriapg/portafolios.git
cd portafolios/ColorLab
npm ci
npm run dev
```

## Organización

```text
app/
  main.tsx                    Entrada de React
  globals.css                 Sistema visual y estilos adaptables
components/colorlab/
  color-lab.tsx               Composición, exportación y favoritas
  color-swatch.tsx            Editor reutilizable de un color
  live-preview.tsx            Interfaz de muestra y variables CSS
  contrast-panel.tsx          Selección y evaluación del contraste
hooks/use-colorlab.ts         Estado y persistencia local
lib/colorlab.ts               Funciones puras de color y paletas
tests/colorlab.test.mjs       Pruebas con el ejecutor nativo de Node
```

Los diálogos, paneles, pestañas, selectores y tablas usan componentes de Radix UI y shadcn. Los créditos de terceros se conservan en `THIRD_PARTY_NOTICES.md` y `vendor/`. Los estilos propios están escritos en CSS; no hay un servicio externo de generación de paletas.

## Decisiones técnicas

**Una fuente de verdad.** El array tipado de cinco colores alimenta el editor, el contraste, la vista previa y la exportación. Cada posición tiene un rol semántico explícito.

**Lógica separada de la interfaz.** La conversión de colores, la luminancia y la generación son funciones puras. `useColorLab` gestiona el estado y la persistencia; los componentes reciben propiedades y acciones.

**Contraste sin redondeos incorrectos.** Se calcula luminancia relativa con la transferencia sRGB y la relación `(L_claro + 0.05) / (L_oscuro + 0.05)`. Los umbrales se evalúan con precisión completa; la cifra visible se trunca a dos decimales. Un valor de 4.499 no obtiene AA para texto normal.

**No prometer accesibilidad global.** La evaluación se refiere a la pareja de texto y fondo seleccionada, no a una auditoría completa de la página. Los colores editados libremente pueden producir combinaciones de contraste bajo; el estudio permite detectarlas. Las etiquetas de los botones de muestra eligen blanco o negro según el mejor contraste.

**Persistencia defensiva.** Un esquema versionado valida el contenido de `localStorage`, ignora entradas dañadas y evita duplicados. Cuando el navegador bloquea el almacenamiento, las favoritas siguen funcionando durante la sesión con un aviso.

## Pruebas

Las pruebas cubren blanco/negro, luminancia sRGB, simetría del contraste, umbrales AA/AAA, valores grises próximos al límite, colores inválidos, las 32 combinaciones de bloqueos, legibilidad de temas generados, exportación y recuperación de favoritas. No requieren servicios externos ni un navegador. No sustituyen a pruebas de interacción en navegadores reales.

## Referencias

- [W3C: Contraste mínimo, WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C: Contraste mejorado, WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html)

## Guion de demostración para el portfolio

1. Genera una paleta y muestra cómo cambia toda la interfaz.
2. Bloquea un color y vuelve a generar.
3. Edita el color de texto y observa cómo cambia su contraste.
4. Guarda la paleta, genera otra y recupera la favorita.
5. Copia las variables CSS.

En una entrevista puedes explicar la transferencia sRGB, la decisión de no redondear los umbrales, el flujo de estado compartido y la validación del almacenamiento.
