<script lang="ts">
  import ArrowBack from "eva-icons/outline/svg/arrow-back-outline.svg?component";
  import ExternalLink from "eva-icons/outline/svg/external-link-outline.svg?component";
  import { downloadFile, fetchData, fetchErrors } from "../dump";
  import NotFound from "./NotFound.svelte";
  import { inject } from "regexparam";
  import { routes } from "../router";
  import DumpIndex from "./DumpIndex.svelte";

  export let params: { dumpUrl: string; id: string };
  const url = decodeURIComponent(params.dumpUrl);

  const data = Promise.all([fetchData(url), fetchErrors(url)]).then(
    ([data, errors]) => ({ data, errors }),
  );
</script>

<main class="mx-auto max-w-3xl">
  <div class="rounded-lg border bg-white m-2">
    {#await data}
      <p class="p-6">Cargando dataset...</p>
    {:then { data, errors }}
      {@const dataset = data.dataset.find((d) => d.identifier === params.id)}
      {#if !dataset}
        <NotFound />
      {:else}
        <header class="py-5 px-6 border-b border-b-gray-200">
          <small>
            Viendo dataset de
            <a
              class="underline text-blue-500"
              target="_blank"
              rel="noopener"
              href={url}>{url}</a
            >
          </small>
          <small>
            <a
              class="flex text-blue-500 leading-none gap-1 items-center"
              href={inject(routes.DumpIndex, { dumpUrl: params.dumpUrl })}
            >
              <ArrowBack fill="currentColor" class="h-[1.25em]" />
              Volver a dataset {data.title}
            </a>
          </small>
          <h1 class="font-bold text-3xl">{dataset.title}</h1>
          <p class="text-xl">{dataset.description}</p>
        </header>
        <ul class="divide-y divide-gray-100">
          {#each dataset.distribution as dist}
            {@const error = errors.find(
              (e) =>
                e.datasetIdentifier === dataset.identifier &&
                e.distributionIdentifier === dist.identifier,
            )}
            <li class="flex px-6 py-5 justify-between items-center">
              {#if error}
                {dist.title}
                (no está en este dump porque hubo un error al bajarlo)
              {:else}
                <div>
                  <h3>
                    {dist.title}
                    {#if dist.format}
                      <span
                        class="border border-current text-blue-800 relative inline-flex items-center text-xs font-semibold pl-2 pr-2.5 py-1 rounded-full ml-1"
                      >
                        <span>{dist.format}</span>
                      </span>
                    {/if}
                  </h3>
                  {#if dist.fileName}
                    <small>{dist.fileName}</small>
                  {/if}
                </div>
                <div class="flex flex-col items-center">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:shadow-outline focus:outline-none"
                    on:click={() => downloadFile(url, dataset.identifier, dist)}
                    >Descargar</button
                  >
                  <a
                    class="flex items-center leading-none text-gray-600 gap-1 pt-2"
                    href={dist.downloadURL}
                    target="_blank"
                    rel="noopener"
                  >
                    <ExternalLink fill="currentColor" class="h-4" />
                    Fuente
                  </a>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/await}
  </div>
</main>
