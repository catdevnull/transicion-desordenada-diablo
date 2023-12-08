<script lang="ts">
  import { inject } from "regexparam";
  import ExternalLink from "eva-icons/outline/svg/external-link-outline.svg?component";
  import { fetchDumpMetadata } from "../fetch";
  import { routes } from "../router";

  export let params: { dumpUrl: string };
  const url = decodeURIComponent(params.dumpUrl);

  const metadataPromise = fetchDumpMetadata(url);
</script>

<main class="mx-auto max-w-3xl">
  <div class="rounded-lg border bg-white m-2">
    {#await metadataPromise}
      <p class="p-6">Cargando..</p>
    {:then metadata}
      <header class="py-5 px-6 border-b border-b-gray-200 leading-none">
        <small>
          Viendo archivo en
          <a
            class="underline text-blue-500"
            target="_blank"
            rel="noopener"
            href={url}>{url}</a
          >
        </small>
        <!-- <h1 class="font-bold text-3xl">{data.title}</h1>
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
        {/if} -->
      </header>

      <ul class="divide-y divide-gray-100">
        {#each metadata.sites as site}
          {@const portalLink = inject(routes.Portal, {
            portalUrl: encodeURIComponent(`${url}/${site.path}`),
          })}
          <li>
            <div class="flex px-6 py-5 justify-between gap-3">
              <div class="flex flex-col">
                <h3 class="text-lg">{site.title}</h3>
                <p class="text-sm">{site.description}</p>
              </div>
              <div class="flex flex-col items-center justify-center shrink-0">
                <a
                  href={portalLink}
                  class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:shadow-outline focus:outline-none"
                  >Ver portal</a
                >
                <a
                  class="flex items-center leading-none text-gray-600 gap-1 pt-2"
                  href={site.url}
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink fill="currentColor" class="h-4" />
                  Fuente
                </a>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {:catch error}
      Hubo un error intenando cargar este archivo. <pre>{error}</pre>
    {/await}
  </div>
</main>
