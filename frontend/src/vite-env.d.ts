/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module "*svg?component" {
  import { ComponentType, SvelteComponentTyped } from "svelte";
  const icon: ComponentType<SvelteComponentTyped>;
  export default icon;
}
