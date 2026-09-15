# Casa Belén — Calculadora de pedidos

Calculadora de pedidos para uso interno de Cerería Casa Belén. Es una PWA
(app web instalable) que funciona completamente sin conexión y sin
backend: todo vive en el teléfono, en IndexedDB.

**App en vivo:** https://irving-norte.github.io/casa-belen-calculadora/

---

## Qué hace

- Calcula pedidos por categoría de producto (velas, moldes de barro,
  moldes de madera, aromas), con tarifa General o Alumno según aplique.
- Guarda un historial de pedidos con el precio **congelado** al momento
  de guardarlos — cambiar un precio en el catálogo nunca altera un
  pedido ya guardado.
- Permite editar precios del catálogo, uno por uno o en lote vía CSV
  (Excel / Google Sheets).
- Exporta/importa un respaldo completo (catálogo + historial) en JSON.
- Genera el texto listo para pegar en WhatsApp con el formato exacto del
  pedido.
- Funciona sin internet una vez instalada.

## Qué NO hace (a propósito)

Sin login, sin backend, sin base de datos remota, sin sincronización
entre dispositivos, sin inventario, sin facturación. Es una calculadora
local, no una tienda en línea. Si el negocio crece y hace falta
compartir datos entre varios teléfonos, ese es el momento de reconsiderar
esta decisión — no antes.

---

## Stack

Vite + React + TypeScript + Tailwind CSS 4 + Dexie (IndexedDB) +
`vite-plugin-pwa`. Sin servidor: el sitio es 100% estático.

## Cómo correrlo en tu computadora

```bash
npm install
npm run dev       # servidor local con recarga en vivo
npm run test      # las 160 pruebas automáticas
npm run build     # build de producción + typecheck
```

## Cómo se despliega

Cada `git push` a `main` dispara `.github/workflows/desplegar.yml`, que
corre las pruebas, compila, y publica en GitHub Pages. Si las pruebas
fallan, no se publica nada — así un error nunca llega a producción.

`.github/workflows/ci.yml` hace lo mismo en cada Pull Request, para
revisar cambios antes de fusionarlos a `main`.

## Estructura del proyecto

```
src/
  lib/
    dominio/     ← Lógica pura de negocio (sin React, sin Dexie).
                   Aquí viven las reglas de precios, validaciones,
                   formato de WhatsApp, CSV, respaldo. Todo testeado.
    db/          ← Todo lo que toca IndexedDB (Dexie). Cada archivo es
                   el repositorio de una tabla: productos, pedidos, meta.
    hooks/       ← Conecta la capa de dominio/db con React.
  pantallas/     ← Las 5 pantallas de la app + sus componentes.
  data/          ← El catálogo inicial (los 94 productos).
  test/          ← Las 160 pruebas (Vitest).
```

**Regla de oro del proyecto:** la resolución de precios (`precios.ts`) y
la congelación de precios en un pedido (`pedido.ts`) son el corazón de la
app. Cualquier cambio ahí debe pasar por las pruebas existentes antes de
tocar nada más — son las que evitan que un pedido histórico cambie de
precio por accidente.

## Cómo agregar o quitar un producto del catálogo

El MVP fue diseñado para un catálogo fijo (94 productos: 3 velas, 40
moldes de barro, 17 de madera, 34 aromas) y **no** tiene UI para
agregar/quitar productos, solo para editar precios. Si el catálogo
cambia de tamaño en el futuro:

1. Edita `src/data/catalogo-inicial.ts`
2. Actualiza `src/test/catalogo.golden.test.ts` con los nuevos productos
   esperados (a propósito es una transcripción independiente, no
   importa nada del archivo anterior)
3. Ten en cuenta que el nuevo producto **no aparecerá** en teléfonos que
   ya tengan la app instalada — la siembra del catálogo es idempotente
   (nunca se re-siembra si ya existe), así que hace falta o bien: el
   botón "Restaurar catálogo de fábrica" en Ajustes (borra ediciones de
   precio del usuario), o construir una migración específica.

## Decisiones de diseño que vale la pena recordar

- **Dinero en centavos, siempre.** Nunca flotantes. Ver
  `src/lib/dominio/dinero.ts`.
- **El id de un producto nunca es solo el número.** `moldes-barro-1` y
  `moldes-madera-1` son productos distintos con precios distintos. Ver
  `crearProductoId()` en `tipos.ts`.
- **Un pedido guardado se puede editar (cantidades, agregar/quitar
  líneas) pero nunca puede cambiar de tipo de cliente.** Para eso existe
  "Duplicar como pedido nuevo". Ver el comentario en
  `pedidos.repo.ts::actualizar()`.
- **Un borrador sin guardar sí recalcula precios al cambiar de tipo de
  cliente** (a diferencia de un pedido guardado). Ver
  `recalcularPreciosPorTipoCliente()` en `pedido.ts`.
- **Importar un respaldo reemplaza todo, nunca fusiona.** Con un nivel
  de "deshacer" guardado internamente, no como archivo aparte.

## Historial de fases

El proyecto se construyó en 10 fases, cada una verificada en el teléfono
antes de avanzar a la siguiente. El documento de diseño técnico original
(compartido al inicio del proyecto) tiene el detalle completo de
arquitectura, modelo de datos y decisiones D-1 a D-13.
