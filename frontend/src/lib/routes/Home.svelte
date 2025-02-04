<script lang="ts">
  import Container from "../components/Container.svelte";
  import Dump from "./Home/Dump.svelte";
</script>

<main class="prose mx-auto dark:prose-invert">
  <Container>
    <div class="px-6 pt-5">
      <h1>Archivo de portales de datos abiertos de Argentina</h1>
      <p>
        Explorá respaldos de los datos publicados en 50 portales de datos
        abiertos.
      </p>
      <p>
        Este proyecto surge en el marco de la solicitada "Por un gobierno de
        datos abiertos" publicada el 5/12 por el grupo de usuaries de datos de
        Argentina y firmada por una serie de organizaciones de la sociedad civil
        y daterxs. <a href="https://bit.ly/CartaDatosAbiertos"
          >Leer la solicitada</a
        >
      </p>

      <h2 class="my-4">Respaldos</h2>
    </div>

    <div class="not-prose">
      <ul
        class="divide-y divide-gray-100 border-y border-y-gray-100 dark:divide-gray-700 dark:border-y-gray-700"
      >
        <!-- para ver diferencias entre dumps descomprimidos (fish shell): diff -u (find data-2023-12-09 -printf '%P\n' | sort | psub) (find data -printf '%P\n' | sort | psub)|less -->

        <!-- nPortales: find . -maxdepth 1 -mindepth 1 -type d | wc -l -->
        <!-- nDatasets: jq '.dataset | length' */data.json | awk '{s+=$1} END {print s}' -->
        <!-- size: du -sh -->
        <Dump
          dumpUrl="https://datos-argentina.s3.us-west-004.backblazeb2.com/dump-2025-02-03"
          nPortales={50}
          nDatasets={4202}
          size="167 GB"
          glow>3 de febrero de 2025</Dump
        >
        <Dump
          dumpUrl="https://datos-argentina.s3.us-west-004.backblazeb2.com/dump-2023-12-09"
          nPortales={51}
          nDatasets={4157}
          size="155 GB">29 de diciembre de 2023</Dump
        >
        <Dump
          dumpUrl="https://datos-argentina.s3.us-west-004.backblazeb2.com/dump-2023-12-09"
          nPortales={50}
          nDatasets={4098}
          size="147 GB">9 de diciembre de 2023</Dump
        >
        <Dump
          dumpUrl="https://datos-argentina.s3.us-west-004.backblazeb2.com/dump-2023-12-08"
          nPortales={43}
          nDatasets={3277}
          size="100 GB">8 de diciembre de 2023</Dump
        >
      </ul>
    </div>

    <div class="px-6 py-5">
      <p>
        Las herramientas para descargar masivamente los archivos fueron
        desarrolladas por
        <a href="https://nulo.ar">Nulo</a> (y con ayuda de varias personas). El
        código está disponible
        <a
          href="https://github.com/catdevnull/transicion-desordenada-diablo/"
          rel="noopener">en GitHub</a
        >.
      </p>
    </div>
  </Container>
</main>
