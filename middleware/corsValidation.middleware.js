import dotenv from "dotenv";
import { AppError } from "../errors/errors.js";
dotenv.config();

//Allowed origins
const corsValidation = (req, res, next) => {
    const requiredEnv = [
        "DATABASE_URL",
        "JWT_SECRET",
        "REFRESH_TOKEN_SECRET",
        "ALLOWED_ORIGINS"
    ];

    for(const key of requiredEnv){
        if (!process.env[key]) {
            throw AppError(`Missing environment variable: ${key}`);
        }
    }

    const origines = process.env.ALLOWED_ORIGINS.split(",").map(or => or.trim()).filter(Boolean);

    if (["PATCH", "POST", "PUT", "DELETE"].includes(req.method) && !origines.includes(req?.headers.origin)) {
        return res.status(403).json({
            message: "Invalid Origin"
        });
    }

    next();
}
export default corsValidation;