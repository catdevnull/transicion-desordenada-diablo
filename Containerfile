FROM docker.io/alpine:3.18 as build
RUN apk add --no-cache npm esbuild
COPY package.json download_json.js /tmp/build
RUN cd /tmp/build && \
    npm install && \
    esbuild --bundle --format=cjs --platform=node --outfile=build.js download_json.js

FROM docker.io/alpine:3.18
RUN apk add --no-cache nodejs-current tini
COPY pki/ca_intermediate_root_bundle.pem /usr/lib/ca_intermediate_root_bundle.pem
COPY --from=build /tmp/build/build.js /usr/local/bin/download_json.js
ENV NODE_EXTRA_CA_CERTS=/usr/lib/ca_intermediate_root_bundle.pem
WORKDIR /data
CMD ["/sbin/tini", "node", "/usr/local/bin/download_json.js", "https://datos.gob.ar/data.json"]