<script lang="ts">
  import ExternalLink from "eva-icons/outline/svg/external-link-outline.svg?component";

  export let href: string;
</script>

<a
  class="flex items-center gap-1 leading-none text-gray-600 dark:text-gray-300"
  {href}
  target="_blank"
  rel="noopener"
>
  <ExternalLink fill="currentColor" class="h-4 shrink-0" />
  <span class="w-full break-words underline">
    <slot>Fuente</slot>
  </span>
</a>
