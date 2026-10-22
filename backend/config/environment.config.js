const REQUIRED_OAUTH_VARIABLES = [
    "CLIENT_ID",
    "CLIENT_SECRET",
    "CLIENT_URL",
    "REDIRECT_URI"
];

const REQUIRED_DATABASE_VARIABLES = [
    "DATABASE_USERNAME",
    "DATABASE_PASSWORD",
    "DATABASE_NAME",
    "DATABASE_PORT",
    "DATABASE_HOST"
];

const REQUIRED_JWT_SECRETS = [
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET"
];
const MIN_JWT_SECRET_LENGTH = 32;

const findMissingVariables = (names, env) => names.filter((name) => {
    return typeof env[name] !== "string" || !env[name].trim();
});

const parseHttpUrl = (value, variableName) => {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(`${variableName} must be a valid HTTP or HTTPS URL`);
    }

    if (
        !["http:", "https:"].includes(url.protocol)
        || !url.hostname
        || url.username
        || url.password
        || url.hash
    ) {
        throw new Error(`${variableName} must be a valid HTTP or HTTPS URL`);
    }

    return url;
};

export const validateEnvironment = (env = process.env) => {
    const missingDatabaseVariables = findMissingVariables(REQUIRED_DATABASE_VARIABLES, env);
    if (missingDatabaseVariables.length > 0) {
        throw new Error(`Missing required database configuration: ${missingDatabaseVariables.join(", ")}`);
    }

    if (!/^\d+$/.test(env.DATABASE_PORT) || Number(env.DATABASE_PORT) < 1 || Number(env.DATABASE_PORT) > 65535) {
        throw new Error("DATABASE_PORT must be an integer between 1 and 65535");
    }

    const missingJwtSecrets = findMissingVariables(REQUIRED_JWT_SECRETS, env);
    if (missingJwtSecrets.length > 0) {
        throw new Error(`Missing required JWT configuration: ${missingJwtSecrets.join(", ")}`);
    }

    const insecureJwtSecrets = REQUIRED_JWT_SECRETS.filter((name) => {
        return env[name].length < MIN_JWT_SECRET_LENGTH;
    });
    if (insecureJwtSecrets.length > 0) {
        throw new Error(`JWT secrets must be at least ${MIN_JWT_SECRET_LENGTH} characters: ${insecureJwtSecrets.join(", ")}`);
    }

    const missingOAuthVariables = findMissingVariables(REQUIRED_OAUTH_VARIABLES, env);
    if (missingOAuthVariables.length > 0) {
        throw new Error(`Missing required OAuth configuration: ${missingOAuthVariables.join(", ")}`);
    }

    const clientUrl = parseHttpUrl(env.CLIENT_URL, "CLIENT_URL");
    if (clientUrl.search) {
        throw new Error("CLIENT_URL must not contain a query string");
    }

    const redirectUri = parseHttpUrl(env.REDIRECT_URI, "REDIRECT_URI");
    if (redirectUri.pathname !== "/auth/google/callback" || redirectUri.search) {
        throw new Error("REDIRECT_URI must point to /auth/google/callback without a query string");
    }

    if (env.NODE_ENV === "production" && (clientUrl.protocol !== "https:" || redirectUri.protocol !== "https:")) {
        throw new Error("CLIENT_URL and REDIRECT_URI must use HTTPS in production");
    }
};
