import multer, { diskStorage } from "multer";
import path from "path";

const storage = diskStorage({
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        cb(null, `${crypto.randomUUID()}${ext}`);
    },

    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), "upload", "image"));
    }
});

const upload = multer({
    storage
})

export default {
    upload
}