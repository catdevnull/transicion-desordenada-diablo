<script lang="ts">
  import type { Params } from "navaid";
  import { currentRoute, type ComponentType } from "./lib/router";

  import NotFound from "./lib/routes/NotFound.svelte";
  import DumpIndex from "./lib/routes/DumpIndex.svelte";
  import Dataset from "./lib/routes/Dataset.svelte";

  function chooseComponent(route: ComponentType) {
    if (route === "NotFound") return NotFound;
    else if (route === "Dataset") return Dataset;
    else if (route === "DumpIndex") return DumpIndex;
  }

  $: component = chooseComponent($currentRoute.component);
  $: params = $currentRoute.params as any;
</script>

<svelte:component this={component} {params} />
