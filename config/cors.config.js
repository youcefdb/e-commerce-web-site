import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const clientOrigin = process.env.CLIENT_URL?.trim() || (isProduction ? "" : "http://localhost:3000");

export const allowedOrigins = [...new Set([
    ...configuredOrigins,
    ...(clientOrigin ? [clientOrigin] : [])
])];

export const isAllowedOrigin = (origin) => allowedOrigins.includes(origin);

const corsOptions = {
    origin(origin, callback) {
        callback(null, !origin || isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204
};

export default corsOptions;
