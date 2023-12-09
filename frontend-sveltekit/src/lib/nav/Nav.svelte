<script lang="ts">
  import { inject } from "regexparam";
  import ChevronRight from "eva-icons/outline/svg/chevron-right-outline.svg?component";
  import { generateDumpName, routes } from "../router";
  import NavItem from "./NavItem.svelte";

  export let params:
    | { dumpUrl: string }
    | { dumpUrl: string; portal: string }
    | { dumpUrl: string; portal: string; id: string };

  $: kind = "id" in params ? "dataset" : "portal" in params ? "portal" : "dump";

  $: dumpName = generateDumpName(params.dumpUrl);
</script>

<nav class="flex justify-between m-2">
  <ol
    class="flex items-center mb-3 text-sm text-neutral-500 dark:text-neutral-300 [&_.active-breadcrumb]:text-neutral-600 dark:[&_.active-breadcrumb]:text-neutral-200 [&_.active-breadcrumb]:font-bold sm:mb-0"
    class:active-breadcrumb={kind === "dump"}
  >
    <NavItem href={inject(routes.Dump, params)} active={kind === "dump"}
      >{dumpName}</NavItem
    >
    {#if "portal" in params}
      <ChevronRight class="w-5 h-5 text-neutral-400" fill="currentColor" />
      <NavItem href={inject(routes.Portal, params)} active={kind === "portal"}>
        {params.portal}
      </NavItem>
    {/if}
    {#if "id" in params}
      <ChevronRight class="w-5 h-5 text-neutral-400" fill="currentColor" />
      <NavItem
        href={inject(routes.Dataset, params)}
        active={kind === "dataset"}
      >
        {params.id}
      </NavItem>
    {/if}
  </ol>
</nav>
