<script lang="ts">
  import { inject } from "regexparam";
  import ArrowForward from "eva-icons/outline/svg/arrow-forward-outline.svg?component";
  import { downloadFile, fetchData, fetchErrors } from "../dump";
  import { routes } from "../router";

  export let params: { dumpUrl: string };
  const url = decodeURIComponent(params.dumpUrl);

  const data = Promise.all([fetchData(url), fetchErrors(url)]).then(
    ([data, errors]) => ({ data, errors }),
  );
</script>

<main class="mx-auto max-w-3xl">
  <div class="rounded-lg border bg-white m-2">
    {#await data}
      <p class="p-6">Cargando..</p>
    {:then { data, errors }}
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
        <h1 class="font-bold text-3xl">{data.title}</h1>
        <p class="text-xl">{data.description}</p>
      </header>
      <ul class="divide-y divide-gray-100">
        {#each data.dataset as dataset}
          {@const datasetLink = inject(routes.Dataset, {
            dumpUrl: params.dumpUrl,
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
      Hubo un error intenando cargar este dump. <pre>{error}</pre>
    {/await}
  </div>
</main>
