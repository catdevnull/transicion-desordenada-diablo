<script lang="ts">
  import ArrowForward from "eva-icons/outline/svg/arrow-forward-outline.svg?component";
  import { inject } from "regexparam";
  import { routes } from "../../router";
</script>

<li>
  <a
    class="shadow-glow flex justify-between px-6 py-5 shadow-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
    href={inject(routes.Dump, {
      dumpUrl: encodeURIComponent("https://archivos.nulo.ar/dump-2023-12-08/"),
    })}
  >
    <div>
      <h3 class="text-lg">8 de diciembre de 2023</h3>
      <!-- <span
        class="relative ml-1 inline-flex items-center rounded-full border border-current px-2 py-1 text-xs font-semibold text-blue-800 dark:text-blue-400"
      >
        <span>portales</span>
      </span>
      <span
        class="relative ml-1 inline-flex items-center rounded-full border border-current px-2 py-1 text-xs font-semibold text-blue-800 dark:text-blue-400"
      >
        <span>datasets</span>
      </span> -->
    </div>
    <ArrowForward
      fill="currentColor"
      aria-hidden="true"
      class="w-6 shrink-0 text-gray-600 dark:text-gray-400  "
    />
  </a>
</li>
