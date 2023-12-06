import navaid, { type Params } from "navaid";
import { writable } from "svelte/store";

import NotFound from "./routes/NotFound.svelte";
import DumpIndex from "./routes/DumpIndex.svelte";
import Dataset from "./routes/Dataset.svelte";
import type { ComponentType } from "svelte";

export const routes = {
  DumpIndex: "/d/:dumpUrl",
  Dataset: "/d/:dumpUrl/dataset/:id",
};

type Route = {
  component: ComponentType;
  params?: Params;
};
export const currentRoute = writable<Route>();

export const router = navaid(undefined, () =>
  currentRoute.set({ component: NotFound })
);
router.on(routes.DumpIndex, (params) =>
  currentRoute.set({ component: DumpIndex, params })
);
router.on(routes.Dataset, (params) =>
  currentRoute.set({ component: Dataset, params })
);
router.listen();
