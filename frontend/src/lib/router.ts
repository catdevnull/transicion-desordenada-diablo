import navaid, { type Params } from "navaid";
import { writable } from "svelte/store";

export const routes = {
  Portal: "/portal/:portalUrl",
  Dataset: "/portal/:portalUrl/dataset/:id",
};

export type ComponentType = "NotFound" | "Portal" | "Dataset";

type Route = {
  component: ComponentType;
  params?: Params;
};
export const currentRoute = writable<Route>();

export const router = navaid(undefined, () =>
  currentRoute.set({ component: "NotFound" }),
);
router.on(routes.Portal, (params) =>
  currentRoute.set({ component: "Portal", params }),
);
router.on(routes.Dataset, (params) =>
  currentRoute.set({ component: "Dataset", params }),
);
router.listen();
