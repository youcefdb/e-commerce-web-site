import path from "path";
import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import {
    findUserByEmail,
    findUserById,
    logoutAllSession,
    storeEmailVerificationToken
} from "../auth/auth.repo.js";
import * as usersRepo from "../users/repo.users.js";
import fs from "fs/promises";
import processImage from "../../utils/processImage.util.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "../auth/email.service.js";

const uploadDir = path.join(process.cwd(), "upload", "image");
await fs.mkdir(uploadDir, {recursive: true});

const getStoredPhotoPath = (avatar) => {
    if (typeof avatar !== "string" || avatar.length === 0 || path.isAbsolute(avatar)) {
        return null;
    }

    const absolutePath = path.resolve(process.cwd(), avatar);
    const relativePath = path.relative(uploadDir, absolutePath);
    if (!relativePath || relativePath === "." || relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        return null;
    }

    return absolutePath;
};

//Update user profile
const updateUser = async (userId, data) => {
    const updated = await withTransaction(async(client) => {
        const {name, email, password} = data;
        const user = await findUserById(userId, {db: client});
        throwIfNotFound(user, "User not found");

        let params = [];
        let values = [];
        let index = 2;
        let passwordChanged = false;
        let emailChanged = false;
        let verification = null;

        if (email) {
            const normalizedEmail = email.toLowerCase();
            const findEmail = await findUserByEmail(normalizedEmail, {db: client});

            if (!password) {
                if (!user.password) {
                    throw AppError("Set a password before changing your email address", 409);
                }
                const validCurrentPassword = await bcrypt.compare(data.currentPassword, user.password);
                if (!validCurrentPassword) {
                    throw AppError("Current password is incorrect", 401);
                }
            }

            if (normalizedEmail === user.email.toLowerCase() ) {
                throw AppError("Can't update email with current email", 409);
            }

            if (findEmail) {
                throw AppError("Email already taken", 409);
            }

            params.push(`email = $${index++}`);
            values.push(normalizedEmail);
            params.push(`email_verified_at = $${index++}`);
            values.push(null);
            emailChanged = true;
        }

        if (name) {
            if (name === user.name) {
                throw AppError("Please add new name", 422);
            }
            params.push(`name = $${index++}`);
            values.push(name);
        }

        if (password && user.password != null) {
            const validCurrentPassword = await bcrypt.compare(data.currentPassword, user.password);
            if (!validCurrentPassword) {
                throw AppError("Current password is incorrect", 401);
            }

            const newPassword = await bcrypt.hash(password, 10);
            params.push(`password = $${index++}`);
            values.push(newPassword);
            passwordChanged = true;
        } else if (password) {
            throw AppError("This account does not have a password", 409);
        }

        if (params.length > 0) {
            params.push(`updated_at = $${index++}`);
            values.push(new Date());
            var result = await usersRepo.updateUser(params, values, user.id, {db: client});
            if (emailChanged) {
                const token = crypto.randomBytes(32).toString("base64url");
                const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                await storeEmailVerificationToken({
                    userId: user.id,
                    tokenHash,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }, {db: client});
                verification = {email: email.toLowerCase(), token};
            }
            if (passwordChanged || emailChanged) {
                await logoutAllSession(user.id, {db: client});
            }
        }else{
            throw AppError("Update at least an attribute", 422);
        }

        return {
            message: "Profile updated seccessfully",
            data: result,
            verification
        };
    });
    if (updated.verification) {
        try {
            await sendVerificationEmail(updated.verification.email, updated.verification.token);
        } catch {
            throw AppError("Email changed, but the verification email could not be sent. Request a new verification email using the new email and your password.", 503);
        }
    }
    delete updated.verification;
    if (data.email) {
        updated.message = "Profile updated. Verify the new email address before signing in again.";
    }
    return updated;
}

//Get user profile
const viewProfile = async (userId) => {
    const data = await findUserById(userId);
    throwIfNotFound(data, "User not found");

    const profile = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        created_at: data.created_at
    }

    return {
        data: profile
    }
}

//upload or update photo
const uploadProfilePic = async (photo, userId) => {
    if (!photo) {
        throw AppError("Image is required", 400);
    }

    const user = await findUserById(userId);
    throwIfNotFound(user, "User not found");

    //validate image
    const photoBuffer = await processImage(photo);

    const fileName = `${crypto.randomUUID()}.webp`; //new file name
    const absolutePath = path.join(uploadDir, fileName); //Image complete path
    const relativePath = path.join("upload", "image", fileName); //Image current path

    const oldPhoto = getStoredPhotoPath(user.avatar);

    //save new image
    try {
        await fs.writeFile(absolutePath, photoBuffer);
    } catch (error) {
        await fs.unlink(absolutePath).catch(() => {});
        throw AppError("Failed to save image", 500);
    }

    try {
        //update DB transactionally
        const newPhoto = await withTransaction(async (client) => {
            const data = {
                userId,
                photo: relativePath
            };

            const result = await usersRepo.updateProfilePic(data, {db: client});
            throwIfNotFound(result, "User not found");
            return result;
        });

        //delete old image AFTER DB commit
        if (oldPhoto) {
            await fs.unlink(oldPhoto).catch(() => {});
        }

        return {
            message: "Image changed successfully",
            data: {
                id: newPhoto.id,
                newPhoto: newPhoto.avatar
            }
        };

    } catch (error) {
        //DB transaction rolled back
        //remove the new orphaned image
        await fs.unlink(absolutePath).catch(() => {});

        throw error;
    }
};

//Remove profile picture
const removePhoto = async(userId) => {
    const user = await findUserById(userId);
    throwIfNotFound(user, "User not found");

    const result = await usersRepo.removePhoto({id: userId});
    throwIfNotFound(result, "Fiald to delete the photo");

    const oldPhoto = getStoredPhotoPath(user.avatar);
    if (oldPhoto) {
        await fs.unlink(oldPhoto).catch(() => {});
    }

    return {
        message: "Profile Picture removed successfully"
    }
}

export {
    updateUser,
    viewProfile,
    uploadProfilePic,
    removePhoto
}
