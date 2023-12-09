<script lang="ts">
  export let active: boolean = false;
  export let href: string;
</script>

<li class="min-w-0">
  <a
    {href}
    class="block w-full space-x-1.5 overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-2 py-1.5 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    class:active-breadcrumb={active}
  >
    <slot />
  </a>
</li>
