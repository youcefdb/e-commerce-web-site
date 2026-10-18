import conn from "../config/db.config.js";
import { getIdempotencyKey } from "../modules/auth/auth.repo.js";

const idempotencyKey = async (req, res, next) => {
    try {
        const key = req.headers["idempotency-key"];

        //Check if the key is provided
        if (!key) {
            return res.status(400).json({message: "Idempotency key is required"});
        }
        const data = {
            userId: req.user.id,
            idKey: key
        };

        const result = await getIdempotencyKey(data, {db: conn});

        //The request was already completed
        if (result && result.status === "completed") {
            return res.status(result.response_status).json(result.response_body);
        }

        //The request is still being processed
        if (result && result.status === "pending") {
            return res.status(409).json({
                message: "Request is already being processed"
            });
        }

        //New key: continue to the controller
        req.idempotencyKey = key;

        return next();

    } catch (error) {
        return next(error);
    }
};

export default idempotencyKey;