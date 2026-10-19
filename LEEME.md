# Licitaciones abiertas

Buscador gratuito de licitaciones públicas en plazo en España, con filtro por código CPV y provincia.

## Cómo funciona

1. Dos veces al día, GitHub ejecuta `scripts/actualizar.mjs`.
2. El script lee los datos abiertos de la Plataforma de Contratación del Sector Público
   (perfiles del Estado + plataformas autonómicas agregadas) y guarda solo las licitaciones
   en plazo en `public/data/licitaciones.json`.
3. GitHub Pages publica la carpeta `public` (la web es `public/index.html`).

No hay servidor ni base de datos: todo es gratis.

## Puesta en marcha (una sola vez)

1. Crea en GitHub un repositorio **público** nuevo, por ejemplo `licitaciones`.
2. Sube el contenido de esta carpeta:
   ```
   git init
   git add .
   git commit -m "Primera versión"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/licitaciones.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source: GitHub Actions**.
4. En GitHub: **Settings → Actions → General → Workflow permissions: Read and write permissions** → Save.
5. Pestaña **Actions → Actualizar y publicar → Run workflow**.
   La primera carga lee 120 días hacia atrás y puede tardar entre 30 y 90 minutos.
   Las siguientes tardan uno o dos minutos.
6. La web queda en `https://TU_USUARIO.github.io/licitaciones/`.

## Cambiar la web

Edita `public/index.html` y haz `git add` → `commit` → `push`. Se publica sola en un par de minutos.

## Ajustes

- Frecuencia: línea `cron` en `.github/workflows/actualizar.yml`.
- Volver a cargar desde cero: borra el contenido de `public/data/licitaciones.json`
  (deja `{"meta":{},"items":[]}`) y lanza el workflow a mano.

## Fuente de los datos

Plataforma de Contratación del Sector Público, Ministerio de Hacienda.
Conjuntos «Licitaciones de perfiles de contratante alojados en la Plataforma» y
«Licitaciones publicadas mediante mecanismos de agregación» (sin contratos menores).
