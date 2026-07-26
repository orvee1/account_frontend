// services/auth.js
"use server";

import {
  authRequestOptions,
  formattedResponse,
  publicRequestOptions,
  server,
} from "@/services/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

const getBearerTokenKey = () => "__BearerLoginToken";
const getCompanyIdKey = () => "__CompanyId";

export async function getBearerToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getBearerTokenKey());
  return token?.value || null;
}

export async function getCurrentCompanyId() {
  const cookieStore = await cookies();
  const c = cookieStore.get(getCompanyIdKey());
  return c?.value || null;
}

export async function requestToLogin(loginData) {
  const cookieStore = await cookies();

  try {
    const options = publicRequestOptions();
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

    const response = await fetch(
      `${apiBaseUrl}/api/login`,
      {
        ...options,
        method: "POST",
        body: JSON.stringify(loginData),
        cache: "no-cache",
      }
    );

    const responseData = await formattedResponse(response);
    if (response.ok) {
      cookieStore.set(getBearerTokenKey(), responseData.token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60,
      });

      const companyId =
        responseData?.company_id || responseData?.user?.company_id;
      if (companyId) {
        cookieStore.set(getCompanyIdKey(), String(companyId), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60,
        });
      }
    }

    return responseData;
  } catch (err) {
    console.error("Login error:", err);
    return {
      message: "Authentication Failed!",
      errors: err.message,
      success: false,
      status: null,
    };
  }
}

export async function fetchProfileData() {
  try {
    const options = await authRequestOptions();
    const response = await server.get("/user", {
      ...options,
      next: { tags: ["loggedInProfileData"] },
    });

    if (response.ok) {
      try {
        const data = await response.json();
        console.log("Profile Data fetched successfully:", data);
        return data;
      } catch (err) {
        console.error("Error parsing profile JSON:", err);
        return { user: null };
      }
    } else {
      console.warn("Profile fetch failed with status:", response.status);
      return { user: null };
    }
  } catch (e) {
    console.error("Profile fetch exception:", e);
    return { user: null };
  }
}

export async function fetchUserPermission() {
  try {
    const options = await authRequestOptions();
    const response = await server.get("/user/permissions", { ...options });

    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { permissions: null };
      }
    } else {
      return { permissions: null };
    }
  } catch (e) {
    return { permissions: null };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  try {
    await server.post("/logout", {});
  } catch (error) {
    console.error("Logout revoke failed:", error);
  }
  cookieStore.delete(getBearerTokenKey());
  cookieStore.delete(getCompanyIdKey());
  revalidateTag("loggedInProfileData");
}

export async function isLoggedIn() {
  const { user } = await fetchProfileData();
  if (user) return true;
  return false;
}

export async function fetchCsrf() {
  await server.get("/sanctum/csrf-cookie");
}
