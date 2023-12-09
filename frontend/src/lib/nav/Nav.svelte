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

<nav class="m-2 flex justify-between">
  <ol
    class="mb-3 flex items-center overflow-x-hidden text-sm text-neutral-500 dark:text-neutral-300 sm:mb-0 [&_.active-breadcrumb]:font-bold [&_.active-breadcrumb]:text-neutral-600 dark:[&_.active-breadcrumb]:text-neutral-200"
    class:active-breadcrumb={kind === "dump"}
  >
    <NavItem href={inject(routes.Dump, params)} active={kind === "dump"}
      >{dumpName}</NavItem
    >
    {#if "portal" in params}
      <ChevronRight
        class="h-5 w-5 shrink-0 text-neutral-400"
        fill="currentColor"
      />
      <NavItem href={inject(routes.Portal, params)} active={kind === "portal"}>
        {params.portal}
      </NavItem>
    {/if}
    {#if "id" in params}
      <ChevronRight
        class="h-5 w-5 shrink-0 text-neutral-400"
        fill="currentColor"
      />
      <NavItem
        href={inject(routes.Dataset, params)}
        active={kind === "dataset"}
      >
        {params.id}
      </NavItem>
    {/if}
  </ol>
</nav>
