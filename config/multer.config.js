import multer, { memoryStorage } from "multer";
import { AppError } from "../errors/errors.js";

const upload = multer({
    storage: memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 0,
        parts: 1,
        fieldNameSize: 100
    }
});

const uploadSingleImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Image exceeds the 5 MB size limit"
                : "Invalid image upload";
            return next(AppError(message, statusCode));
        }

        return next(error);
    });
};

export { uploadSingleImage };
export default upload;
