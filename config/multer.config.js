import multer, { memoryStorage } from "multer";

const memory = memoryStorage({
    // filename: (req, file, cb) => {
    //     //Extract file exteniton (.jpg...)
    //     const ext = path.extname(file.originalname);

    //     cb(null, `${crypto.randomUUID()}${ext}`);
    // }
});

const upload = multer({
    storage: memory,
    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => { //type of file (we can find it on HTTP headers as a content-type)
        const allowedType = [
            "image/jpg",
            "image/png",
            "image/webp"
        ]
        
        if (!allowedType.includes(file.mimetype)) {
            return cb(new Error(`${file.mimetype} is not allowed`));
        }
        
        cb(null, true);
    }
})

export default upload