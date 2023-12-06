<script lang="ts">
  import { currentRoute } from "./lib/router";
</script>

<svelte:component
  this={$currentRoute.component}
  params={$currentRoute.params}
/>
