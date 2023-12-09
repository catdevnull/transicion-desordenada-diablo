<script lang="ts">
  import Container from "../components/Container.svelte";
  import Portal from "./Home/Portal.svelte";
</script>

<main class="prose mx-auto dark:prose-invert">
  <Container>
    <div class="px-6 pt-5">
      <h1>Archivo de portales de datos abiertos de Argentina</h1>
      <p>
        Explorá respaldos de los datos publicados en 43 portales de datos
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
        <Portal />
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
