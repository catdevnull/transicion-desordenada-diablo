# WIP: descargador masivo de datos públicos

descarga masivamente archivos de la mayoría de los portales de datos argentinos que tengan un archivo "data.json" ([DCAT](https://www.w3.org/TR/vocab-dcat-2/)). la idea es tener un espejo (mirror) lo más perfecto posible en el caso de que cualquiera de las fuentes se caiga.

## setup

require [Node.js](https://nodejs.org) y [pnpm](https://pnpm.io/)

```
pnpm install
```

## correr

```
# descargar portal datos.gob.ar
pnpm run run https://datos.gob.ar/data.json
# guarda en data/datos.gob.ar_data.json

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

- `{url de data.json sin protocolo y con / reemplazado por _}/`
  - `data.json`
  - `errors.jsonl`: archivo con todos los errores que se obtuvieron al intentar descargar todo.
  - `{identifier de dataset}/`
    - `{identifier de distribution}/`
      - `{fileName (o, si no existe, identifier de distribution)}`

### ejemplo

- `datos.gob.ar_data.json/`
  - `data.json`
  - `errors.jsonl`
  - `turismo_fbc269ea-5f71-45b6-b70c-8eb38a03b8db/`
    - `turismo_0774a0bb-71c2-44d7-9ea6-780e6bd06d50/`
      - `cruceristas-por-puerto-residencia-desagregado-por-pais-mes.csv`
    - ...
  - `energia_0d4a18ee-9371-439a-8a94-4f53a9822664/`
    - `energia_9f602b6e-2bef-4ac4-895d-f6ecd6bb1866/`
      - `energia_9f602b6e-2bef-4ac4-895d-f6ecd6bb1866` (este archivo no tiene fileName en el data.json, entonces se reutiliza el `identifier`)
  - ...
