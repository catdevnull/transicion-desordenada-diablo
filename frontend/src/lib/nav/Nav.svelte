<script lang="ts">
  import { inject } from "regexparam";
  import ChevronRight from "eva-icons/outline/svg/chevron-right-outline.svg?component";
  import { routes } from "../router";
  import Portal from "../routes/Portal.svelte";

  export let params:
    | { dumpUrl: string }
    | { dumpUrl: string; portal: string }
    | { dumpUrl: string; portal: string; id: string };

  function generateDumpName(dumpUrl: string) {
    const clean = decodeURIComponent(dumpUrl).replace(/\/+$/, "");
    return clean.slice(clean.lastIndexOf("/") + 1);
  }

  $: dumpName = generateDumpName(params.dumpUrl);
</script>

<nav class="flex justify-between m-2">
  <ol
    class="flex items-center mb-3 text-sm text-neutral-500 [&_.active-breadcrumb]:text-neutral-600 [&_.active-breadcrumb]:font-medium sm:mb-0"
  >
    <li class="flex items-center h-full">
      <a
        href={inject(routes.Dump, params)}
        class="inline-flex items-center px-2 py-1.5 space-x-1.5 rounded-md hover:text-neutral-900 hover:bg-neutral-100"
      >
        <span>{dumpName}</span>
      </a>
    </li>
    {#if "portal" in params}
      <ChevronRight class="w-5 h-5 text-gray-400" fill="currentColor" />
      <li>
        <a
          href={inject(routes.Portal, params)}
          class="inline-flex items-center px-2 py-1.5 space-x-1.5 font-normal rounded-md hover:bg-neutral-100 hover:text-neutral-900"
        >
          <span>{params.portal}</span>
        </a>
      </li>
    {/if}
    {#if "id" in params}
      <ChevronRight class="w-5 h-5 text-gray-400" fill="currentColor" />
      <li>
        <a
          href={inject(routes.Dataset, params)}
          class="inline-flex items-center px-2 py-1.5 space-x-1.5 font-normal rounded-md hover:bg-neutral-100 hover:text-neutral-900"
        >
          <span>{params.id}</span>
        </a>
      </li>
    {/if}
  </ol>
</nav>
