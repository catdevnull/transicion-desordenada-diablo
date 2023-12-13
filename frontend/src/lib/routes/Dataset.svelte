<script lang="ts">
  import ArrowBack from "eva-icons/outline/svg/arrow-back-outline.svg?component";
  import { downloadFile, fetchData, fetchErrors } from "../fetch";
  import NotFound from "./NotFound.svelte";
  import { inject } from "regexparam";
  import { routes } from "../router";
  import Nav from "../nav/Nav.svelte";
  import SourceLink from "../components/SourceLink.svelte";
  import Container from "../components/Container.svelte";

  export let params: { dumpUrl: string; portal: string; id: string };
  $: url = decodeURIComponent(params.dumpUrl) + "/" + params.portal;

  $: data = Promise.all([fetchData(url), fetchErrors(url)])
    .then(([data, errors]) => ({ data, errors }))
    .catch(alert);
</script>

<main class="mx-auto max-w-3xl">
  <Nav {params} />

  <Container>
    {#await data}
      <p class="p-6">Cargando dataset...</p>
    {:then { data, errors }}
      {@const dataset = data.dataset.find((d) => d.identifier === params.id)}
      {#if !dataset}
        <NotFound />
      {:else}
        <header
          class="border-b border-b-gray-200 px-6 py-5 dark:border-b-gray-700"
        >
          <h1 class="text-3xl font-bold">{dataset.title}</h1>
          <p class="text-xl">{dataset.description}</p>
          <!--
            lo saqué porque aún antes de que venga la motosierra estos links no funcionan...
            entonces no quiero dar la falsa impresión de que empezaron a bajar cosas cuando no es el caso.
            {#if dataset.landingPage}
            <a
              class="flex items-center leading-none text-gray-600 gap-1 pt-2"
              href={dataset.landingPage}
              target="_blank"
              rel="noopener"
            >
              <ExternalLink fill="currentColor" class="h-4" />
              Fuente
            </a>
          {/if} -->
        </header>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          {#each dataset.distribution as dist}
            {@const error = errors.find(
              (e) =>
                e.datasetIdentifier === dataset.identifier &&
                e.distributionIdentifier === dist.identifier,
            )}
            <li
              class="flex flex-col items-center items-stretch justify-between gap-1 px-6 py-5 sm:flex-row"
            >
              <div>
                <h3>
                  {dist.title}
                  {#if dist.format}
                    <span
                      class="relative ml-1 inline-flex items-center rounded-full border border-current px-2 py-1 text-xs font-semibold text-blue-800 dark:text-blue-400"
                    >
                      <span>{dist.format}</span>
                    </span>
                  {/if}
                </h3>
                {#if !dist.downloadURL}
                  <small class="block text-red-700">
                    No está en este archivo porque el link de descarga estaba
                    roto en la fuente al momento de descargarlo :(
                  </small>
                {:else if error}
                  <small class="block text-red-700">
                    No está en este archivo porque hubo un error al descargarlo
                    :(
                  </small>
                {/if}
                {#if dist.fileName}
                  <small>{dist.fileName}</small>
                {/if}
              </div>
              <div
                class="flex flex-row-reverse place-content-end gap-4 sm:flex-col sm:place-content-center sm:items-center sm:gap-2"
              >
                {#if !error}
                  <button
                    type="button"
                    class="focus:shadow-outline inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
                    on:click={() => downloadFile(url, dataset.identifier, dist)}
                    >Descargar</button
                  >
                {/if}
                {#if dist.downloadURL}
                  <SourceLink href={dist.downloadURL} />
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    {/await}
  </Container>
</main>
