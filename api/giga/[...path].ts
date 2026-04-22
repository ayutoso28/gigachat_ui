import { proxyRequest } from "../_proxy";

export const config = { runtime: "nodejs" };

export default async function handler(request: Request): Promise<Response> {
  return proxyRequest(
    request,
    "https://gigachat.devices.sberbank.ru",
    "/api/giga",
  );
}
