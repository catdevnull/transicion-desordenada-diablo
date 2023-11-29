# WIP: descargador masivo de datos públicos

require [Node.js](https://nodejs.org) y [pnpm](https://pnpm.io/)

```
pnpm install
```

## correr

```
# descargar portal datos.gob.ar
pnpm run run https://datos.gob.ar/data.json
# guarda en data/datos.gob.ar

# descargar todos los portales conocidos
pnpm run run
# guarda en data/*
```

## contenedor

```
docker run --rm -it -v ./data:/data gitea.nulo.in/nulo/transicion-desordenada-diablo/downloader
# descarga datos.gob.ar
```

## formato de repo guardado

- `{dominio de repo}`
  - `data.json`
  - `errors.jsonl`: archivo con todos los errores que se obtuvieron al intentar descargar todo.
  - `{identifier de dataset}`
    - `{identifier de distribution}`
      - `{fileName (o, si no existe, identifier de distribution)}`
