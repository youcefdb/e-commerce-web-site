import { AppError } from "../errors/errors.js";

const roleAuthorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.user?.role) {
            return next(AppError("Unauthorized", 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(AppError("Forbidden", 403));
        }

        next();
    };
};

export default roleAuthorize;