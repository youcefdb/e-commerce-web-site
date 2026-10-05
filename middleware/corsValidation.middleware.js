import dotenv from "dotenv";
dotenv.config();

//Allowed origins
const corsValidation = (req, res, next) => {
    const origines = process.env.ALLOWED_ORIGINS.split(",").map(or => or.trim()).filter(Boolean);

    if (["PATCH", "POST", "PUT", "DELETE"].includes(req.method) && !origines.includes(req?.headers.origin)) {
        return res.status(403).json({
            message: "Invalid Origin"
        });
    }

    next();
}
export default corsValidation;