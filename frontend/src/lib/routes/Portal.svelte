<script lang="ts">
  import { inject } from "regexparam";
  import ArrowForward from "eva-icons/outline/svg/arrow-forward-outline.svg?component";
  import ExternalLink from "eva-icons/outline/svg/external-link-outline.svg?component";
  import { fetchData, fetchErrors } from "../fetch";
  import { routes } from "../router";
  import type { Dataset } from "common/schema";

  export let params: { portalUrl: string };
  const url = decodeURIComponent(params.portalUrl);

  const data = Promise.all([fetchData(url), fetchErrors(url)]).then(
    ([data, errors]) => ({ data, errors }),
  );

  function arreglarHomepageUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://"))
      return `https://${url}`;
    return url;
  }

  let query: string = "";
  function filterDatasets(datasets: Dataset[], query: string): Dataset[] {
    return datasets.filter(
      (dataset) =>
        dataset.identifier.includes(query) || dataset.title.includes(query),
    );
  }
</script>

<main class="mx-auto max-w-3xl">
  <div class="rounded-lg border bg-white m-2">
    {#await data}
      <p class="p-6">Cargando..</p>
    {:then { data, errors }}
      <header class="py-5 px-6 border-b border-b-gray-200 leading-none">
        <small>
          Viendo portal archivado de
          <a
            class="underline text-blue-500"
            target="_blank"
            rel="noopener"
            href={url}>{url}</a
          >
        </small>
        <h1 class="font-bold text-3xl">{data.title}</h1>
        <p class="text-xl">{data.description}</p>
        {#if data.homepage}
          <a
            class="flex items-center leading-none text-gray-600 gap-1 pt-2"
            href={arreglarHomepageUrl(data.homepage)}
            target="_blank"
            rel="noopener"
          >
            <ExternalLink fill="currentColor" class="h-4" />
            Fuente
          </a>
        {/if}
      </header>

      <div class="w-full mx-auto px-6 py-2">
        <input
          type="text"
          placeholder="Buscar..."
          class="flex w-full h-10 px-3 py-2 text-sm bg-white border rounded-md border-neutral-300 ring-offset-background placeholder:text-neutral-500 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
          bind:value={query}
        />
      </div>

      <ul class="divide-y divide-gray-100">
        {#each filterDatasets(data.dataset, query) as dataset}
          {@const datasetLink = inject(routes.Dataset, {
            portalUrl: params.portalUrl,
            id: dataset.identifier,
          })}
          <li>
            <a
              class="flex px-6 py-5 hover:bg-gray-50 justify-between"
              href={datasetLink}
            >
              <div>
                <h3 class="text-lg">{dataset.title}</h3>
                <p class="text-sm">{dataset.description}</p>
              </div>
              <ArrowForward
                fill="currentColor"
                aria-hidden="true"
                class="w-6 shrink-0 text-gray-600"
              />
            </a>
          </li>
        {/each}
      </ul>
    {:catch error}
      Hubo un error intenando cargar este portal archivado. <pre>{error}</pre>
    {/await}
  </div>
</main>
