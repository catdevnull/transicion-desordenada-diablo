
FROM docker.io/alpine:3.18 as build
RUN apk add --no-cache npm
RUN npm install -g esbuild
WORKDIR /tmp/build

COPY package.json .
RUN npm install

COPY download_json.js .
RUN esbuild --bundle --format=cjs --platform=node --outfile=build.js --sourcemap=inline download_json.js

FROM docker.io/alpine:3.18
RUN apk add --no-cache nodejs-current tini
COPY pki/ca_intermediate_root_bundle.pem /usr/lib/ca_intermediate_root_bundle.pem
COPY --from=build /tmp/build/build.js /usr/local/bin/download_json.js
ENV NODE_EXTRA_CA_CERTS=/usr/lib/ca_intermediate_root_bundle.pem
WORKDIR /data
CMD ["/sbin/tini", "node", "--enable-source-maps", "/usr/local/bin/download_json.js"]
