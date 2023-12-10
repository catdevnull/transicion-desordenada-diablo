<script lang="ts">
  import ArrowForward from "eva-icons/outline/svg/arrow-forward-outline.svg?component";
  import { inject } from "regexparam";
  import { routes } from "../../router";
  import DumpBadge from "./DumpBadge.svelte";

  export let dumpUrl: string;
  export let nPortales: number;
  export let nDatasets: number;
  export let size: string;
  export let glow: boolean = false;
</script>

<li>
  <a
    class="relative flex justify-between px-6 py-5 shadow-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
    class:shadow-glow={glow}
    class:hover:bg-blue-50={glow}
    class:dark:hover:bg-slate-700={glow}
    class:z-10={glow}
    href={inject(routes.Dump, {
      dumpUrl: encodeURIComponent(dumpUrl),
    })}
  >
    <div>
      <h3 class="text-lg"><slot /></h3>
      <DumpBadge>{nPortales} portales</DumpBadge>
      <DumpBadge>{nDatasets} datasets</DumpBadge>
      <DumpBadge>{size}</DumpBadge>
    </div>
    <ArrowForward
      fill="currentColor"
      aria-hidden="true"
      class="w-6 shrink-0 text-gray-600 dark:text-gray-400"
    />
  </a>
</li>
