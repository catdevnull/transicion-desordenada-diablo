<script lang="ts">
  import { inject } from "regexparam";
  import { routes } from "../router";
  import Container from "../components/Container.svelte";
</script>

<main class="prose mx-auto dark:prose-invert">
  <Container>
    <div class="px-6 py-5">
      <h1>Archivo de portales de datos abiertos</h1>
      <p>
        Esta herramienta permite ver datos en archivos de portales de datos
        abiertos, creada en el marco de
        <a href="https://bit.ly/CartaDatosAbiertos">un pedido hecho</a> al gobierno
        entrante el 10 de diciembre de 2023 por garantizar el mantenimiento de las
        políticas de datos públicos en Argentina.
      </p>

      <div class="not-prose flex place-content-center">
        <a
          href={inject(routes.Dump, {
            dumpUrl: encodeURIComponent(
              "https://archivos.nulo.ar/dump-2023-12-08/",
            ),
          })}
          class="focus:shadow-outline flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-center text-xl font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
        >
          Acceder al archivo creado el 8 de diciembre de 2023
        </a>
      </div>

      <p>
        Los archivos y las herramientas fueron creados por
        <a href="https://nulo.ar">Nulo</a> con ayuda de varias personas. El
        código está disponible
        <a
          href="https://github.com/catdevnull/transicion-desordenada-diablo/"
          rel="noopener">en GitHub</a
        >.
      </p>
    </div>
  </Container>
</main>
