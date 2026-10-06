import { AppError } from "../errors/errors.js";

const globalMiddelware = (error, req, res, next) => {

    if (error.code === "23505") {
        throw AppError("Already exist", 409);
    }

    return res.status(error.statusCode).json(error.message);
}

export default globalMiddelware;