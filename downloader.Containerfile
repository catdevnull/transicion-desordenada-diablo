
FROM docker.io/alpine:3.18 as build
RUN apk add --no-cache npm \
 && npm install -g esbuild pnpm

COPY . /tmp/build/
WORKDIR /tmp/build/downloader
RUN pnpm install \
 && esbuild --bundle --format=cjs --platform=node --outfile=download_json.build.js --sourcemap=inline download_json.js \
 && esbuild --bundle --format=cjs --platform=node --outfile=generate_dump_metadata.build.js --sourcemap=inline generate_dump_metadata.js

FROM docker.io/alpine:3.18
RUN apk add --no-cache nodejs-current tini
COPY downloader/pki/ca_intermediate_root_bundle.pem /usr/lib/ca_intermediate_root_bundle.pem
COPY --from=build /tmp/build/downloader/download_json.build.js /usr/local/bin/download_json.js
COPY --from=build /tmp/build/downloader/generate_dump_metadata.build.js /usr/local/bin/generate_dump_metadata.js
ENV NODE_EXTRA_CA_CERTS=/usr/lib/ca_intermediate_root_bundle.pem
WORKDIR /data
CMD ["/sbin/tini", "node", "--enable-source-maps", "/usr/local/bin/download_json.js"]
