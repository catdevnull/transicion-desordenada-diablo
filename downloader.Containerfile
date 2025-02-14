FROM docker.io/node:20 as build
RUN npm install -g esbuild pnpm

COPY . /tmp/build/
WORKDIR /tmp/build/downloader
RUN pnpm install \
 && esbuild --bundle --format=cjs --platform=node --outfile=download_json.build.js --sourcemap=inline download_json.js \
 && esbuild --bundle --format=cjs --platform=node --outfile=generate_dump_metadata.build.js --sourcemap=inline generate_dump_metadata.js

FROM docker.io/node:20-slim
RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*
COPY downloader/pki/ca_intermediate_root_bundle.pem /usr/lib/ca_intermediate_root_bundle.pem
COPY --from=build /tmp/build/downloader/download_json.build.js /usr/local/bin/download_json.js
COPY --from=build /tmp/build/downloader/generate_dump_metadata.build.js /usr/local/bin/generate_dump_metadata.js
ENV NODE_EXTRA_CA_CERTS=/usr/lib/ca_intermediate_root_bundle.pem
WORKDIR /data
ENTRYPOINT ["/usr/bin/tini", "--", "node", "--enable-source-maps", "/usr/local/bin/download_json.js"]
CMD []
