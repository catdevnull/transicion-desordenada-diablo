<script lang="ts">
  import { currentRoute, type ComponentType } from "./lib/router";

  import NotFound from "./lib/routes/NotFound.svelte";
  import Home from "./lib/routes/Home.svelte";
  import Dump from "./lib/routes/Dump.svelte";
  import Portal from "./lib/routes/Portal.svelte";
  import Dataset from "./lib/routes/Dataset.svelte";

  function chooseComponent(route: ComponentType) {
    if (route === "NotFound") return NotFound;
    else if (route === "Home") return Home;
    else if (route === "Dataset") return Dataset;
    else if (route === "Portal") return Portal;
    else if (route === "Dump") return Dump;
  }

  $: component = chooseComponent($currentRoute.component) as any;
  $: params = $currentRoute.params as any;
</script>

<svelte:component this={component} {params} />
