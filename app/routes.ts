import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("caixa-de-entrada", "routes/inbox.tsx"),
  route("pastas/:id", "routes/pastas.$id.tsx"),
  route("api/pastas", "routes/api.pastas.ts"),
] satisfies RouteConfig;
