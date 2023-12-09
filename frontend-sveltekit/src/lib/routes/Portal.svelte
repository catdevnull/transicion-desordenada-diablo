<script lang="ts">
  import { inject } from "regexparam";
  import ArrowForward from "eva-icons/outline/svg/arrow-forward-outline.svg?component";
  import { fetchData, fetchErrors } from "../fetch";
  import { routes } from "../router";
  import type { Dataset } from "common/schema";
  import Nav from "../nav/Nav.svelte";
  import SourceLink from "../components/SourceLink.svelte";
  import Container from "../components/Container.svelte";

  export let params: { dumpUrl: string; portal: string };
  $: url = `${decodeURIComponent(params.dumpUrl)}/${params.portal}`;

  $: data = Promise.all([fetchData(url), fetchErrors(url)]).then(
    ([data, errors]) => ({ data, errors }),
  );

  function arreglarHomepageUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://"))
      return `https://${url}`;
    return url;
  }

  function processStringForSearch(str: string): string {
    return str
      .toLowerCase()
      .replaceAll("á", "a")
      .replaceAll("é", "e")
      .replaceAll("í", "i")
      .replaceAll("ó", "o")
      .replaceAll("ú", "u")
      .replaceAll("ñ", "n");
  }

  let query: string = "";
  function filterDatasets(datasets: Dataset[], query: string): Dataset[] {
    const q = processStringForSearch(query);
    return datasets.filter(
      (dataset) =>
        processStringForSearch(dataset.identifier).includes(q) ||
        processStringForSearch(dataset.title).includes(q),
    );
  }
</script>

<main class="mx-auto max-w-3xl">
  <Nav {params} />

  <Container>
    {#await data}
      <p class="p-6">Cargando..</p>
    {:then { data, errors }}
      <header
        class="py-5 px-6 border-b border-b-gray-200 dark:border-b-gray-700 leading-none"
      >
        <small>
          Viendo portal archivado de
          <a
            class="underline text-blue-500 dark:text-blue-300"
            target="_blank"
            rel="noopener"
            href={url}>{url}</a
          >
        </small>
        <h1 class="font-bold text-3xl">{data.title}</h1>
        <p class="text-xl">{data.description}</p>
        {#if data.homepage}
          <SourceLink href={arreglarHomepageUrl(data.homepage)} />
        {/if}
      </header>

      <div class="w-full mx-auto px-6 py-2">
        <input
          type="text"
          placeholder="Buscar..."
          class="flex w-full h-10 px-3 py-2 text-sm bg-white dark:bg-gray-800 border rounded-md border-neutral-300 dark:border-gray-700 ring-offset-background placeholder:text-neutral-500 dark:placeholder:text-gray-500 focus:border-neutral-300 dark:focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          bind:value={query}
        />
      </div>

      <ul class="divide-y divide-gray-100 dark:divide-gray-700">
        {#each filterDatasets(data.dataset, query) as dataset}
          {@const datasetLink = inject(routes.Dataset, {
            dumpUrl: params.dumpUrl,
            portal: params.portal,
            id: dataset.identifier,
          })}
          <li>
            <a
              class="flex px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700 justify-between"
              href={datasetLink}
            >
              <div>
                <h3 class="text-lg">{dataset.title}</h3>
                <p class="text-sm">{dataset.description}</p>
              </div>
              <ArrowForward
                fill="currentColor"
                aria-hidden="true"
                class="w-6 shrink-0 text-gray-600 dark:text-gray-400  "
              />
            </a>
          </li>
        {/each}
      </ul>
    {:catch error}
      Hubo un error intenando cargar este portal archivado. <pre>{error}</pre>
    {/await}
  </Container>
</main>
