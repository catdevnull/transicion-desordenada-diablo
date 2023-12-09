<script lang="ts">
  import ExternalLink from "eva-icons/outline/svg/external-link-outline.svg?component";

  export let href: string;
</script>

<a
  class="flex items-center leading-none text-gray-600 dark:text-gray-300 gap-1 pt-2"
  {href}
  target="_blank"
  rel="noopener"
>
  <ExternalLink fill="currentColor" class="h-4" />
  <span class="underline">Fuente</span>
</a>
