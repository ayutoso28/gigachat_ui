import { proxyRequest } from "../_proxy.js";

export const config = { runtime: "nodejs" };

export default async function handler(request: Request): Promise<Response> {
  return proxyRequest(
    request,
    "https://ngw.devices.sberbank.ru:9443",
    "/api/ngw",
  );
}
