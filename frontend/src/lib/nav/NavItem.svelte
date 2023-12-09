<script lang="ts">
  export let active: boolean = false;
  export let href: string;
</script>

<li class="flex items-center h-full">
  <a
    {href}
    class="inline-flex items-center px-2 py-1.5 space-x-1.5 rounded-md hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-gray-100 dark:hover:bg-gray-800"
    class:active-breadcrumb={active}
  >
    <span><slot /></span>
  </a>
</li>
