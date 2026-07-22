export const normalizePath = (path = "/") => {
  const cleaned = String(path || "/").split("?")[0].replace(/\/+$/, "");
  return cleaned || "/";
};

export const routeMatches = (pathname, routePath) => {
  const current = normalizePath(pathname);
  const route = normalizePath(routePath);

  if (route === "/") {
    return current === "/";
  }

  return current === route || current.startsWith(`${route}/`);
};

export const getCurrentPageName = (pathname, navItems, fallback = "Dashboard") => {
  const routes = navItems.flatMap((item) => [
    { name: item.name, path: item.path },
    ...(item.subItems || []).map((subItem) => ({
      name: subItem.name,
      path: subItem.path,
    })),
  ]);

  const match = getBestRouteMatch(pathname, routes);

  return match?.name || fallback;
};

export const getBestRouteMatch = (pathname, routes) => {
  return routes
    .filter((route) => routeMatches(pathname, route.path))
    .sort((a, b) => normalizePath(b.path).length - normalizePath(a.path).length)[0];
};
