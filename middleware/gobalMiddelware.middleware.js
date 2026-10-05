import { AppError } from "../errors/errors.js";

const globalMiddelware = (error, req, res, next) => {
    console.log(error);

    if (error.code === "23505") {
        throw AppError("Product already exist", 409);
        }

    return res.status(error.statusCode).json(error.message);
}

export default globalMiddelware;