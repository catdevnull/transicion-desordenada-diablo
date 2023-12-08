import navaid, { type Params } from "navaid";
import { writable } from "svelte/store";

export const routes = {
  Home: "/",
  Dump: "/dump/:dumpUrl",
  Portal: "/portal/:portalUrl",
  Dataset: "/portal/:portalUrl/dataset/:id",
};

export type ComponentType = "NotFound" | keyof typeof routes;

type Route = {
  component: ComponentType;
  params?: Params;
};
export const currentRoute = writable<Route>();

export const router = navaid(undefined, () =>
  currentRoute.set({ component: "NotFound" }),
);
for (const [component, path] of Object.entries(routes)) {
  router.on(path, (params) =>
    currentRoute.set({ component: component as keyof typeof routes, params }),
  );
}
router.listen();
