# Glosario de Minería

App aparte con el estilo visual de **Acero y Roca** (logo, tipografías Bebas Neue / Source Serif 4 / IBM Plex Sans, paleta carbono-cobre-ocre).

## Qué incluye

- **Glosario amplio** (~189 términos) desde `Glosario_amplio_minero_argentino.md`
- Buscador unificado (términos + leyes), sinónimos, autocomplete y highlights
- Fichas `/termino/:id` y `/ley/:id` (favoritos, link, imprimir/PDF)
- **Diferencias** esenciales y **Quiz** de autoevaluación
- Ejemplos San Juan, fuentes y links a Acero y Roca
- Contraste alto / texto grande
- **Panel Editar** (PIN `mineria`): localStorage, historial, propuestas Supabase, import/export JSON y Markdown

## Desarrollo

```bash
cd "Glosario de mineria"
npm install
cp .env.example .env.local   # opcional: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Reimportar el documento amplio

```bash
npm run import:amplio
```

Regenera `src/data/glossary.json` y `src/data/glossary-meta.json`.

## Build

```bash
npm run build
npm run preview
```

## Nota

Las ediciones viven en el navegador. Para publicar de forma permanente: exportá JSON/MD, reimportá el markdown, o configurá Supabase para propuestas (`glosario_proposals` / `glosario_history`).
