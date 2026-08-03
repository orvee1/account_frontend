// services/server.js
import { getBearerToken } from "./auth";

const api_base_url = process.env.NEXT_PUBLIC_API_URL;
const proxy_base_url = "/api/backend";

const server = {};

function normalizeApiBaseUrl(baseUrl) {
  if (!baseUrl) return baseUrl;

  return baseUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
}

function normalizeApiPath(url) {
  if (!url) return url;
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

  if (normalizedUrl.startsWith("/api") || normalizedUrl.startsWith("/sanctum")) {
    return normalizedUrl;
  }

  return `/api${normalizedUrl}`;
}

// Client-side requests go through the same-origin proxy. Auth stays in httpOnly cookies.
export function clientAuthRequestOptions({ headers } = { headers: {} }) {
  const authHeaders = new Headers();

  if (headers) {
    Object.keys(headers).forEach((key) => {
      authHeaders.append(key, headers[key]);
    });
  }

  authHeaders.set("Accept", "application/json");

  if (!authHeaders.has("Content-Type")) {
    authHeaders.set("Content-Type", "application/json");
  }

  return {
    headers: authHeaders,
    redirect: "follow",
  };
}

// Server-side version that uses cookies (for server components)
export async function authRequestOptions({ headers } = { headers: {} }) {
  const authHeaders = new Headers();

  if (headers) {
    Object.keys(headers).forEach((key) => {
      authHeaders.append(key, headers[key]);
    });
  }

  authHeaders.set("Accept", "application/json");

  if (!authHeaders.has("Content-Type")) {
    authHeaders.set("Content-Type", "application/json");
  }

  const bearerToken = await getBearerToken();

  if (bearerToken) {
    authHeaders.set("Authorization", `Bearer ${bearerToken}`);
  }

  return {
    headers: authHeaders,
    redirect: "follow",
  };
}

// ✅ নতুন: Login এর জন্য আলাদা options — token ছাড়া
export function publicRequestOptions({ headers } = { headers: {} }) {
  const authHeaders = new Headers();

  if (headers) {
    Object.keys(headers).forEach((key) => {
      authHeaders.append(key, headers[key]);
    });
  }

  authHeaders.set("Accept", "application/json");

  if (!authHeaders.has("Content-Type")) {
    authHeaders.set("Content-Type", "application/json");
  }

  return {
    headers: authHeaders,
    redirect: "follow",
  };
}

function queryParamString(queryParamObject) {
  return customSerialize(queryParamObject).length > 0
    ? `?${customSerialize(queryParamObject)}`
    : "";
}

function customSerialize(obj, prefix = "") {
  const query = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          query.push(`${fullKey}[${i}]=${encodeURIComponent(v)}`);
        });
      } else if (typeof value === "object" && value !== null) {
        query.push(customSerialize(value, fullKey));
      } else {
        query.push(`${fullKey}=${encodeURIComponent(value)}`);
      }
    }
  }

  return query.join("&");
}

const methods = ["get", "post", "put", "patch", "delete", "options"];

function requestUrl(url, queryString = "") {
  const base = typeof window === "undefined" ? api_base_url : proxy_base_url;

  if (!base) {
    throw new Error("API base URL is not configured.");
  }

  const normalizedBase =
    typeof window === "undefined"
      ? normalizeApiBaseUrl(base)
      : base.replace(/\/+$/, "");
  const normalizedUrl = normalizeApiPath(url);
  return `${normalizedBase}${normalizedUrl}${queryString}`;
}

methods.map(function (requestMethod) {
  server[requestMethod] = async function (url, data = {}, options = {}) {
    const queryString = queryParamString(
      requestMethod === "get" ? data?.params : options?.params
    );

    const method = requestMethod.toUpperCase();
    const headers =
      (requestMethod === "get" ? data.headers : options.headers) || {};
    const isFormData =
      typeof FormData !== "undefined" && requestMethod !== "get" && data instanceof FormData;

    const authOptions = typeof window === "undefined"
      ? await authRequestOptions({ headers })
      : clientAuthRequestOptions({ headers });

    let requestOptions = {
      ...(requestMethod === "get" ? data : options),
      ...authOptions,
      method,
      ...(requestMethod !== "get" && data
        ? { body: isFormData ? data : JSON.stringify(data) }
        : {}),
    };

    if (isFormData) {
      requestOptions.headers.delete("Content-Type");
    }

    try {
      return await fetch(requestUrl(url, queryString), {
        ...requestOptions,
        ...{ cache: process.env.CACHE || "no-cache" },
      });
    } catch (error) {
      console.error(`Fetch failed for ${method} ${url}`, error);
      throw error;
    }
  };
});

async function formattedResponse(response) {
  let responseJson;
  try {
    responseJson = (await response?.json()) || {};
  } catch {
    responseJson = {};
  }

  return {
    ...responseJson,
    success: response.ok,
    status: response.status,
    status_text: response.statusText,
  };
}

async function responseData(response) {
  let responseJson;
  try {
    responseJson = (await response?.json()) || {};
  } catch {
    responseJson = {};
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data: responseJson,
  };
}

export {
  api_base_url,
  proxy_base_url,
  formattedResponse,
  normalizeApiBaseUrl,
  responseData,
  server,
};
