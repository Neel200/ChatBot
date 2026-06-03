// lib/authFetch.ts
// Wraps fetch for authenticated requests.
// If the server returns 401 (expired / invalid token), clears the session
// and redirects the user to /login automatically.

export function clearSessionAndRedirect() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  window.location.replace("/login");
}

export async function authFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearSessionAndRedirect();
    throw new Error("Session expired. Please log in again.");
  }

  return res;
}
