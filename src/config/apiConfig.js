/**
 * Canonical API and Origin URL Resolver
 * Configures the backend base URL for all API requests and websocket connections.
 */
export const resolveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  const DEFAULT_BACKEND = "http://13.206.118.180:7372";

  let base = (envUrl || DEFAULT_BACKEND)
    .replace(/\/api\/?$/, "")
    .replace(/\/+$/, "");

  return base;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = API_BASE_URL;
