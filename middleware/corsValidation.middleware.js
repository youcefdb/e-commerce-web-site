import dotenv from "dotenv";
import { AppError } from "../errors/errors.js";
import { isAllowedOrigin } from "../config/cors.config.js";
dotenv.config();

//Allowed origins
const corsValidation = (req, res, next) => {
    const requiredEnv = [
        "DATABASE_HOST",
        "DATABASE_PORT",
        "DATABASE_NAME",
        "DATABASE_USERNAME",
        "DATABASE_PASSWORD",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
        "ALLOWED_ORIGINS"
    ];

    for(const key of requiredEnv){
        if (!process.env[key]) {
            throw AppError(`Missing environment variable: ${key}`);
        }
    }

    if (["PATCH", "POST", "PUT", "DELETE"].includes(req.method) && !isAllowedOrigin(req.headers.origin)) {
        return res.status(403).json({
            message: "Invalid Origin"
        });
    }

    next();
}
export default corsValidation;
