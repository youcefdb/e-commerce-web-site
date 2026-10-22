import { isAllowedOrigin } from "../config/cors.config.js";

//Allowed origins
const corsValidation = (req, res, next) => {
    if (["PATCH", "POST", "PUT", "DELETE"].includes(req.method) && !isAllowedOrigin(req.headers.origin)) {
        return res.status(403).json({
            message: "Invalid Origin"
        });
    }

    next();
}
export default corsValidation;
