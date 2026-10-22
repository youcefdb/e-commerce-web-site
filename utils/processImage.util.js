import sharp from "sharp";
import { AppError } from "../errors/errors.js";

export const MAX_IMAGE_WIDTH = 12_000;
export const MAX_IMAGE_HEIGHT = 12_000;
export const MAX_IMAGE_PIXELS = 40_000_000;

const supportedFormats = new Set(["jpeg", "png", "webp"]);

const invalidImage = () => AppError("Invalid Photo", 400);

const processImage = async (photo) => {
    if (!photo?.buffer || !Buffer.isBuffer(photo.buffer) || photo.buffer.length === 0) {
        throw invalidImage();
    }

    let metadata;
    try {
        metadata = await sharp(photo.buffer, {
            failOn: "warning",
            limitInputPixels: MAX_IMAGE_PIXELS
        }).metadata();
    } catch {
        throw invalidImage();
    }

    const { width, height, format, pages = 1 } = metadata;
    if (
        !supportedFormats.has(format)
        || !Number.isInteger(width)
        || !Number.isInteger(height)
        || width < 1
        || height < 1
        || width > MAX_IMAGE_WIDTH
        || height > MAX_IMAGE_HEIGHT
        || width * height > MAX_IMAGE_PIXELS
        || pages !== 1
    ) {
        throw invalidImage();
    }

    try {
        return await sharp(photo.buffer, {
            failOn: "warning",
            limitInputPixels: MAX_IMAGE_PIXELS
        })
            .resize({
                withoutEnlargement: true,
                width: 800
            })
            .webp({ quality: 80 })
            .toBuffer();
    } catch {
        throw invalidImage();
    }
};

export default processImage;
