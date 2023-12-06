<script lang="ts">
  import { inject } from "regexparam";
  import { downloadFile, fetchData, fetchErrors } from "../dump";
  import { routes } from "../router";

  export let params: { dumpUrl: string };
  const url = decodeURIComponent(params.dumpUrl);

  const data = Promise.all([fetchData(url), fetchErrors(url)]).then(
    ([data, errors]) => ({ data, errors })
  );
</script>

<main>
  {#await data}
    Cargando..
  {:then { data, errors }}
    <h1>{data.title}</h1>
    <p>{data.description}</p>
    <ul>
      {#each data.dataset as dataset}
        {@const datasetLink = inject(routes.Dataset, {
          dumpUrl: params.dumpUrl,
          id: dataset.identifier,
        })}
        <li>
          <a href={datasetLink}>{dataset.title}</a>
        </li>
      {/each}
    </ul>
  {:catch error}
    Hubo un error intenando cargar este dump. <pre>{error}</pre>
  {/await}
</main>
