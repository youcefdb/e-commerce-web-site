import dotenv from "dotenv";

dotenv.config();

const normalizeConfiguredUrl = (value, variableName, allowPath = false) => {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(`${variableName} must contain a valid HTTP or HTTPS URL`);
    }

    if (
        !["http:", "https:"].includes(url.protocol)
        || !url.hostname
        || url.hostname.includes("*")
        || url.username
        || url.password
        || url.search
        || url.hash
        || (!allowPath && url.pathname !== "/")
    ) {
        throw new Error(`${variableName} must contain ${allowPath ? "a valid HTTP or HTTPS client URL" : "HTTP or HTTPS origins without paths"}`);
    }

    return url.origin;
};

const normalizeRequestOrigin = (origin) => {
    if (typeof origin !== "string" || !origin.trim()) {
        return null;
    }

    try {
        const url = new URL(origin);
        if (
            !["http:", "https:"].includes(url.protocol)
            || !url.hostname
            || url.hostname.includes("*")
            || url.username
            || url.password
            || url.pathname !== "/"
            || url.search
            || url.hash
        ) {
            return null;
        }
        return url.origin;
    } catch {
        return null;
    }
};

export const resolveAllowedOrigins = (env = process.env) => {
    const rawAllowedOrigins = typeof env.ALLOWED_ORIGINS === "string"
        ? env.ALLOWED_ORIGINS.trim()
        : "";
    const origins = [];

    if (rawAllowedOrigins) {
        const configured = rawAllowedOrigins.split(",").map((origin) => origin.trim());
        if (configured.some((origin) => !origin)) {
            throw new Error("ALLOWED_ORIGINS must be a comma-separated list of HTTP or HTTPS origins");
        }
        origins.push(...configured.map((origin) => normalizeConfiguredUrl(origin, "ALLOWED_ORIGINS")));
    }

    const clientUrl = typeof env.CLIENT_URL === "string" ? env.CLIENT_URL.trim() : "";
    if (clientUrl) {
        origins.push(normalizeConfiguredUrl(clientUrl, "CLIENT_URL", true));
    }

    if (origins.length === 0) {
        if (env.NODE_ENV === "production") {
            throw new Error("Configure CLIENT_URL and/or ALLOWED_ORIGINS before starting in production");
        }
        origins.push("http://localhost:3000");
    }

    return [...new Set(origins)];
};

export const allowedOrigins = resolveAllowedOrigins();
const allowedOriginSet = new Set(allowedOrigins);

export const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeRequestOrigin(origin);
    return normalizedOrigin !== null && allowedOriginSet.has(normalizedOrigin);
};

const corsOptions = {
    origin(origin, callback) {
        callback(null, !origin || isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key"],
    optionsSuccessStatus: 204
};

export default corsOptions;
