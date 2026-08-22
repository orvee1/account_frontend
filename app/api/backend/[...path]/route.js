import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_COOKIE = "__BearerLoginToken";

function normalizeApiBaseUrl(baseUrl) {
  if (!baseUrl) return baseUrl;

  return baseUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
}

function normalizeProxyPath(path) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");

  if (
    normalizedPath.startsWith("api/") ||
    normalizedPath === "api" ||
    normalizedPath.startsWith("sanctum/")
  ) {
    return normalizedPath;
  }

  return `api/${normalizedPath}`;
}

async function handler(request, { params }) {
  if (!API_BASE_URL) {
    return Response.json({ message: "API base URL is not configured." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const authorization = request.headers.get("authorization");
  const path = Array.isArray(params.path) ? params.path.join("/") : "";
  const url = new URL(`${normalizeApiBaseUrl(API_BASE_URL)}/${normalizeProxyPath(path)}`);

  const requestUrl = new URL(request.url);
  requestUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (accept) {
    headers.set("Accept", accept);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (authorization) {
    headers.set("Authorization", authorization);
  }

  const init = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = await fetch(url, init);
  const responseHeaders = new Headers();
  const upstreamContentType = upstreamResponse.headers.get("content-type");

  if (upstreamContentType) {
    responseHeaders.set("Content-Type", upstreamContentType);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
