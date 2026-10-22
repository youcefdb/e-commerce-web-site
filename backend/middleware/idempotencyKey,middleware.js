import conn from "../config/db.config.js";
import { getIdempotencyKey } from "../modules/auth/auth.repo.js";
import { createHash } from "crypto";

const normalizeRequest = (value) => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map(normalizeRequest);
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((key) => [key, normalizeRequest(value[key])])
        );
    }

    return value;
};

const hashIdempotencyRequest = (body, operation = {}) => {
    const normalizedBody = normalizeRequest(body ?? {});

    // Product order does not change the requested checkout, so canonicalize it.
    if (Array.isArray(normalizedBody.products?.items)) {
        normalizedBody.products.items.sort((a, b) =>
            String(a?.productId).localeCompare(String(b?.productId))
        );
    }

    const hashInput = {
        method: operation.method ?? "",
        path: operation.path ?? "",
        payload: normalizedBody
    };

    return createHash("sha256").update(JSON.stringify(hashInput)).digest("hex");
};

const idempotencyKey = async (req, res, next) => {
    try {
        const key = req.headers["idempotency-key"];

        //Check if the key is provided
        if (!key) {
            return res.status(400).json({message: "Idempotency key is required"});
        }

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
            return res.status(400).json({message: "Idempotency key must be a UUID"});
        }

        const requestHash = hashIdempotencyRequest(req.body, {
            method: req.method,
            path: `${req.baseUrl ?? ""}${req.path ?? ""}`
        });
        const data = {
            userId: req.user.id,
            idKey: key
        };

        const result = await getIdempotencyKey(data, {db: conn});

        if (result && result.request_hash !== requestHash) {
            return res.status(409).json({
                message: "Idempotency key was already used with a different request"
            });
        }

        if (result && result.status === "completed" && result.response_status && result.response_body !== null) {
            return res.status(result.response_status).json(result.response_body);
        }

        // A committed in-progress record can only be legacy or abandoned state.
        if (result) {
            return res.status(409).json({
                message: "Request is already being processed"
            });
        }

        req.idempotencyKey = key;
        req.idempotencyHash = requestHash;

        return next();

    } catch (error) {
        return next(error);
    }
};

export { hashIdempotencyRequest };
export default idempotencyKey;
