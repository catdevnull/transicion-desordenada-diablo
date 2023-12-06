<script lang="ts">
  import { downloadFile, fetchData, fetchErrors } from "../dump";
  import NotFound from "./NotFound.svelte";

  export let params: { dumpUrl: string; id: string };
  const url = decodeURIComponent(params.dumpUrl);

  const data = Promise.all([fetchData(url), fetchErrors(url)]).then(
    ([data, errors]) => ({ data, errors })
  );
</script>

{#await data}
  Cargando dataset...
{:then { data, errors }}
  {@const dataset = data.dataset.find((d) => d.identifier === params.id)}
  {#if !dataset}
    <NotFound />
  {:else}
    <h1>{dataset.title}</h1>
    <ul>
      {#each dataset.distribution as dist}
        {@const error = errors.find(
          (e) =>
            e.datasetIdentifier === dataset.identifier &&
            e.distributionIdentifier === dist.identifier
        )}
        <li>
          {#if error}
            {dist.title}
            (no está en este dump porque hubo un error al bajarlo)
          {:else}
            <button on:click={() => downloadFile(url, dataset.identifier, dist)}
              >Download</button
            >
            {dist.title}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/await}
