/**
 * Canonical Dynamic API and Origin URL Resolver
 *
 * Supports dynamic configuration via:
 * 1. window.__ENV__.REACT_APP_API_BASE_URL (runtime injection on Render / container boot)
 * 2. window._env_.REACT_APP_API_BASE_URL (alternate runtime injection convention)
 * 3. window.REACT_APP_API_BASE_URL
 * 4. process.env.REACT_APP_API_BASE_URL (build-time variable)
 * 5. Environment & protocol-aware fallbacks (prevents Mixed Content errors on HTTPS deployments)
 */

export const sanitizeUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  return url.trim().replace(/\/api\/?$/i, "").replace(/\/+$/, "");
};

export const resolveApiBaseUrl = () => {
  // 1. Check runtime environment configuration injected at container/server boot
  const runtimeUrl =
    (typeof window !== "undefined" && window.__ENV__ && window.__ENV__.REACT_APP_API_BASE_URL) ||
    (typeof window !== "undefined" && window._env_ && window._env_.REACT_APP_API_BASE_URL) ||
    (typeof window !== "undefined" && window.REACT_APP_API_BASE_URL);

  // 2. Check build-time environment variable
  const buildUrl = process.env.REACT_APP_API_BASE_URL;

  // 3. Known production/Render backend and local fallback
  const RENDER_PROD_BACKEND = "https://righttouch-backend-fn9z.onrender.com";
  const DEFAULT_LOCAL_BACKEND = "http://13.206.118.180:7372";

  let candidate = runtimeUrl || buildUrl;

  // 4. Protocol & deployment environment check to prevent Mixed Content blocking:
  if (typeof window !== "undefined" && window.location) {
    const isHttps = window.location.protocol === "https:";
    const isRenderHosted = (window.location.hostname || "").includes("onrender.com");

    if (candidate) {
      const sanitized = sanitizeUrl(candidate);
      // If the dashboard is loaded over HTTPS, any HTTP remote request will be strictly
      // blocked by the browser as Mixed Content.
      if (isHttps && sanitized.startsWith("http://")) {
        const isLocal =
          sanitized.includes("localhost") || sanitized.includes("127.0.0.1");

        if (!isLocal) {
          // If candidate is a domain (not raw IP:port), upgrade to https://
          // If candidate is raw IP (which has no valid SSL certificate) or if hosted on Render,
          // redirect safely to the HTTPS production backend.
          if (/^http:\/\/\d+\.\d+\.\d+\.\d+(:[0-9]+)?/.test(sanitized)) {
            candidate = RENDER_PROD_BACKEND;
          } else {
            candidate = sanitized.replace(/^http:\/\//i, "https://");
          }
        }
      }
    } else {
      // If candidate is empty:
      if (isRenderHosted || isHttps) {
        candidate = RENDER_PROD_BACKEND;
      } else {
        candidate = DEFAULT_LOCAL_BACKEND;
      }
    }
  }

  if (!candidate) {
    candidate =
      process.env.NODE_ENV === "production"
        ? RENDER_PROD_BACKEND
        : DEFAULT_LOCAL_BACKEND;
  }

  return sanitizeUrl(candidate);
};

export const resolveApiOrigin = () => {
  const baseUrl = resolveApiBaseUrl();
  try {
    const urlObj = new URL(baseUrl);
    return urlObj.origin;
  } catch (e) {
    return baseUrl;
  }
};

// Aliases for clear programmatic calls
export const getApiBaseUrl = () => resolveApiBaseUrl();
export const getApiOrigin = () => resolveApiOrigin();
export const getApiEndpoint = (endpoint = "") => {
  const base = resolveApiBaseUrl();
  const cleanEndpoint = (endpoint || "").replace(/^\/+/, "").replace(/^api\//, "");
  return `${base}/api/${cleanEndpoint}`;
};

// Exported variables for direct import (evaluated dynamically)
export const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = resolveApiOrigin();

export default resolveApiBaseUrl;
