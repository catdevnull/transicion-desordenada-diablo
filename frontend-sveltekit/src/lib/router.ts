import navaid, { type Params } from "navaid";
import { writable } from "svelte/store";

export const routes = {
  Home: "/",
  Dump: "/dump/:dumpUrl",
  Portal: "/dump/:dumpUrl/:portal",
  Dataset: "/dump/:dumpUrl/:portal/dataset/:id",
};

export function generateDumpName(dumpUrl: string) {
  const clean = decodeURIComponent(dumpUrl).replace(/\/+$/, "");
  return clean.slice(clean.lastIndexOf("/") + 1);
}

const title = "Archivo de portales de datos de Argentina";
const titles: { [key in ComponentType]: (params: Params) => string } = {
  Home: () => title,
  NotFound: () => title,
  Dump: (params) => `${generateDumpName(params.dumpUrl)} - ${title}`,
  Portal: (params) => `${params.portal} - ${title}`,
  Dataset: (params) => `${params.id} - ${title}`,
};

export type ComponentType = "NotFound" | keyof typeof routes;

type Route = {
  component: ComponentType;
  params?: Params;
};
export const currentRoute = writable<Route>({ component: "Home" });
currentRoute.subscribe(
  (route) => (document.title = titles[route.component](route.params!)),
);

export const router = navaid(undefined, () =>
  currentRoute.set({ component: "NotFound" }),
);
for (const [component, path] of Object.entries(routes)) {
  router.on(path, (params) =>
    currentRoute.set({ component: component as keyof typeof routes, params }),
  );
}
router.listen();
