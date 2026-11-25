import {
  resolveApiBaseUrl,
  resolveApiOrigin,
  sanitizeUrl,
  getApiEndpoint,
} from "./apiConfig";

describe("apiConfig", () => {
  const originalEnv = process.env;

  const setWindowLocation = (href) => {
    delete window.location;
    window.location = new URL(href);
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete window.__ENV__;
    delete window._env_;
    delete window.REACT_APP_API_BASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    delete window.__ENV__;
    delete window._env_;
    delete window.REACT_APP_API_BASE_URL;
  });

  test("sanitizeUrl strips trailing slashes and /api suffix", () => {
    expect(sanitizeUrl("http://localhost:7372/api/")).toBe("http://localhost:7372");
    expect(sanitizeUrl("http://localhost:7372/api")).toBe("http://localhost:7372");
    expect(sanitizeUrl("http://localhost:7372///")).toBe("http://localhost:7372");
    expect(sanitizeUrl("   https://example.com/api   ")).toBe("https://example.com");
  });

  test("uses window.__ENV__.REACT_APP_API_BASE_URL when present", () => {
    setWindowLocation("https://admindashboardrighttouchown-td8t.onrender.com/#/auth/signin");
    window.__ENV__ = { REACT_APP_API_BASE_URL: "https://custom-api.render.com" };

    expect(resolveApiBaseUrl()).toBe("https://custom-api.render.com");
    expect(resolveApiOrigin()).toBe("https://custom-api.render.com");
  });

  test("prevents Mixed Content error by using HTTPS production backend when loaded on Render HTTPS with insecure IP", () => {
    setWindowLocation("https://admindashboardrighttouchown-td8t.onrender.com/#/auth/signin");
    window.__ENV__ = { REACT_APP_API_BASE_URL: "http://13.206.118.180:7372" };

    expect(resolveApiBaseUrl()).toBe("https://righttouch-backend-fn9z.onrender.com");
    expect(resolveApiOrigin()).toBe("https://righttouch-backend-fn9z.onrender.com");
  });

  test("auto-upgrades http to https for domain names when page is on https", () => {
    setWindowLocation("https://custom.domain.com");
    window.__ENV__ = { REACT_APP_API_BASE_URL: "http://api.domain.com" };

    expect(resolveApiBaseUrl()).toBe("https://api.domain.com");
  });

  test("allows localhost HTTP in local development", () => {
    setWindowLocation("http://localhost:3000");
    window.__ENV__ = { REACT_APP_API_BASE_URL: "http://13.206.118.180:7372" };

    expect(resolveApiBaseUrl()).toBe("http://13.206.118.180:7372");
  });

  test("getApiEndpoint formats clean api path", () => {
    setWindowLocation("https://admindashboardrighttouchown-td8t.onrender.com");
    window.__ENV__ = { REACT_APP_API_BASE_URL: "https://righttouch-backend-fn9z.onrender.com" };

    expect(getApiEndpoint("user/login/owner")).toBe(
      "https://righttouch-backend-fn9z.onrender.com/api/user/login/owner"
    );
    expect(getApiEndpoint("/api/user/me")).toBe(
      "https://righttouch-backend-fn9z.onrender.com/api/user/me"
    );
  });
});
