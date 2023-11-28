# WIP: descargador masivo de datos públicos

require [Node.js](https://nodejs.org) y [pnpm](https://pnpm.io/)

```
pnpm install
```

## correr

```
pnpm run run download_json.js https://datos.gob.ar/data.json
# guarda en ./datos.gob.ar
```

## formato de repo guardado

- `{dominio de repo}`
  - `data.json`
  - `errors.jsonl`
  - `{identifier de dataset}`
    - `{identifier de distribution}`
      - `{fileName (o, si no existe, identifier de distribution)}`
