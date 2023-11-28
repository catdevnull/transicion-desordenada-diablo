
FROM docker.io/alpine:3.18 as build
RUN apk add --no-cache npm esbuild
RUN npm install -g esbuild
WORKDIR /tmp/build

COPY package.json .
RUN npm install

COPY download_json.js .
RUN esbuild --bundle --format=cjs --platform=node --outfile=build.js download_json.js

FROM docker.io/alpine:3.18
RUN apk add --no-cache nodejs-current tini
COPY pki/ca_intermediate_root_bundle.pem /usr/lib/ca_intermediate_root_bundle.pem
COPY --from=build /tmp/build/build.js /usr/local/bin/download_json.js
ENV NODE_EXTRA_CA_CERTS=/usr/lib/ca_intermediate_root_bundle.pem
WORKDIR /data
CMD ["/sbin/tini", "node", "/usr/local/bin/download_json.js", "https://datos.gob.ar/data.json", "http://datos.energia.gob.ar/data.json", "https://datos.magyp.gob.ar/data.json", "https://datos.acumar.gov.ar/data.json", "https://datasets.datos.mincyt.gob.ar/data.json", "https://datos.arsat.com.ar/data.json", "https://datos.cultura.gob.ar/data.json", "https://datos.mininterior.gob.ar/data.json", "https://datos.produccion.gob.ar/data.json", "https://datos.salud.gob.ar/data.json", "https://datos.transporte.gob.ar/data.json", "https://ckan.ciudaddemendoza.gov.ar/data.json", "https://datos.santafe.gob.ar/data.json", "https://datosabiertos.chaco.gob.ar/data.json", "https://datosabiertos.gualeguaychu.gov.ar/data.json", "https://datosabiertos.mercedes.gob.ar/data.json", "http://luj-bue-datos.paisdigital.innovacion.gob.ar/data.json", "https://datosabiertos.desarrollosocial.gob.ar", "http://datos.mindef.gov.ar/data.json"]
