<script lang="ts">
  import { inject } from "regexparam";
  import { fetchDumpMetadata } from "../fetch";
  import { routes } from "../router";
  import SourceLink from "../components/SourceLink.svelte";
  import Container from "../components/Container.svelte";

  export let params: { dumpUrl: string };
  $: url = decodeURIComponent(params.dumpUrl);

  $: metadataPromise = fetchDumpMetadata(url);
</script>

<main class="mx-auto max-w-3xl">
  <Container>
    {#await metadataPromise}
      <p class="p-6">Cargando..</p>
    {:then metadata}
      <header
        class="border-b border-b-gray-200 px-6 py-5 leading-none dark:border-b-gray-700"
      >
        <small>
          Viendo archivo en
          <a
            class="text-blue-500 underline dark:text-blue-300"
            target="_blank"
            rel="noopener"
            href={url}>{url}</a
          >
        </small>
        <h1 class="mt-2 text-3xl font-bold">
          Portales ({metadata.sites.length})
        </h1>
      </header>

      <ul class="divide-y divide-gray-100 dark:divide-gray-700">
        {#each metadata.sites as site}
          {@const portalLink = inject(routes.Portal, {
            dumpUrl: params.dumpUrl,
            portal: site.path,
          })}
          <li>
            <div class="flex justify-between gap-3 px-6 py-5">
              <div class="flex flex-col">
                <h3 class="text-lg">{site.title}</h3>
                <p class="text-sm">{site.description}</p>
              </div>
              <div class="flex shrink-0 flex-col items-center justify-center">
                <a
                  href={portalLink}
                  class="focus:shadow-outline inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
                  >Ver portal</a
                >
                <SourceLink href={site.url} />
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {:catch error}
      <div class="p-6">
        <p>Hubo un error intenando cargar este archivo.</p>
        <p class="text-red-700 dark:text-red-500">{error}</p>
      </div>
    {/await}
  </Container>
</main>
