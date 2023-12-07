import navaid, { type Params } from "navaid";
import { writable } from "svelte/store";

export const routes = {
  DumpIndex: "/d/:dumpUrl",
  Dataset: "/d/:dumpUrl/dataset/:id",
};

export type ComponentType = "NotFound" | "DumpIndex" | "Dataset";

type Route = {
  component: ComponentType;
  params?: Params;
};
export const currentRoute = writable<Route>();

export const router = navaid(undefined, () =>
  currentRoute.set({ component: "NotFound" })
);
router.on(routes.DumpIndex, (params) =>
  currentRoute.set({ component: "DumpIndex", params })
);
router.on(routes.Dataset, (params) =>
  currentRoute.set({ component: "Dataset", params })
);
router.listen();
