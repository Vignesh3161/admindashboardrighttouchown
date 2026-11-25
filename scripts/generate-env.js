const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load .env files with appropriate priority
const projectRoot = path.resolve(__dirname, "..");
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.argv.includes("production") ||
  process.argv.includes("build");

// Read .env.production first if in production mode, then fallback to .env
if (isProduction && fs.existsSync(path.join(projectRoot, ".env.production"))) {
  dotenv.config({ path: path.join(projectRoot, ".env.production") });
}
if (fs.existsSync(path.join(projectRoot, ".env"))) {
  dotenv.config({ path: path.join(projectRoot, ".env") });
}

// Gather all REACT_APP_* variables from process.env
const envConfig = {};
for (const key of Object.keys(process.env)) {
  if (key.startsWith("REACT_APP_")) {
    envConfig[key] = process.env[key];
  }
}

// If REACT_APP_API_BASE_URL is not set and we are in production, provide default Render backend URL
if (!envConfig.REACT_APP_API_BASE_URL) {
  if (isProduction) {
    envConfig.REACT_APP_API_BASE_URL = "https://righttouch-backend-fn9z.onrender.com";
  } else {
    envConfig.REACT_APP_API_BASE_URL = "http://13.206.118.180:7372";
  }
}

const fileContent = `// Auto-generated runtime environment configuration
// This file is dynamically updated on server startup and build.
window.__ENV__ = Object.assign(window.__ENV__ || {}, ${JSON.stringify(
  envConfig,
  null,
  2
)});
`;

const targets = [
  path.join(projectRoot, "public", "env-config.js"),
];

if (fs.existsSync(path.join(projectRoot, "build"))) {
  targets.push(path.join(projectRoot, "build", "env-config.js"));
}

for (const target of targets) {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, fileContent, "utf8");
    console.log(`[generate-env] Successfully wrote runtime config to ${path.relative(projectRoot, target)}`);
  } catch (err) {
    console.error(`[generate-env] Error writing to ${target}:`, err.message);
  }
}

console.log(`[generate-env] Active REACT_APP_API_BASE_URL: ${envConfig.REACT_APP_API_BASE_URL}`);
