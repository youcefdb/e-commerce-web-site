import { AppError } from "../errors/errors.js";

const globalMiddelware = (error, req, res, next) => {
    let responseError = error;

    if (error?.type === "entity.parse.failed" && error?.status === 400) {
        responseError = AppError("Invalid JSON format", 400);
    } else if (error?.code === "23505") {
        responseError = error.constraint === "users_email_key" && error.table === "users"
            ? AppError("Email already exists", 409)
            : AppError("Resource already exists", 409);
    }

    const statusCode = responseError?.isAppError === true
        && Number.isInteger(responseError.statusCode)
        && responseError.statusCode >= 400
        && responseError.statusCode <= 599
        ? responseError.statusCode
        : 500;
    const isSafeApplicationError = responseError?.isAppError === true && statusCode < 500;
    const message = isSafeApplicationError && typeof responseError.message === "string"
        ? responseError.message
        : "Internal Server Error";

    if (statusCode >= 500) {
        console.error("Request failed", {
            name: error?.name,
            code: error?.code,
            table: error?.table,
            constraint: error?.constraint,
            stack: typeof error?.stack === "string"
                ? error.stack.split("\n").slice(1).join("\n")
                : undefined
        });
    }

    return res.status(statusCode).json({message});
}

export default globalMiddelware;
