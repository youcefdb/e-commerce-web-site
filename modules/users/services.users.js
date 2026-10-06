import path from "path";
import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import { findUserByEmail, findUserById } from "../auth/auth.repo.js";
import * as usersRepo from "../users/repo.users.js";
import fs from "fs/promises";
import sharp from "sharp";
import bcrypt from "bcrypt";
import crypto from "crypto";

//Update user profile
const updateUser = (userId, data) => {
    return withTransaction(async(client) => {
        const {name, email, password} = data;
        const user = await findUserById(userId, {db: client});

        let params = [];
        let values = [];
        let index = 2;

        if (email) {
            const findEmail = await findUserByEmail(email, {db: client});

            if (email === user.email ) {
                throw AppError("Can't update email with current email", 409);
            }

            if (findEmail) {
                throw AppError("Email already taken", 409);
            }

            params.push(`email = $${index++}`);
            values.push(email);
        }

        if (name) {
            if (name === user.name) {
                throw AppError("Please add new name", 422);
            }
            params.push(`name = $${index++}`);
            values.push(name);
        }

        if (password && user.password != null) {
            const newPassword = await bcrypt.hash(password, 10);
            params.push(`password = $${index++}`);
            values.push(newPassword);
        }

        if (params.length > 0) {
            params.push(`updated_at = $${index++}`);
            values.push(new Date());
            var result = await usersRepo.updateUser(params, values, user.id, {db: client});
        }else{
            throw AppError("Update at least an attribute", 422);
        }

        return {
            message: "Profile updated seccessfully",
            data: result
        }
    });
}

//Get user profile
const viewProfile = async (userId) => {
    const data = await findUserById(userId);
    throwIfNotFound(data, "User not found");
    console.log(userId)

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
    const user = await findUserById(userId);
    throwIfNotFound(user, "User not found");

    //validate image
    const photoBuffer = await processPhoto(photo);

    const fileName = `${crypto.randomUUID()}.webp`; //new file name
    const uploadDir = path.join(process.cwd(), "upload", "image"); //Current path
    const absolutePath = path.join(uploadDir, fileName); //Image complete path
    const relativePath = path.join("upload", "image", fileName); //Image current path

    let oldPhoto = null;

    if (user.avatar) {
        oldPhoto = path.join(process.cwd(), user.avatar);
    }

    //save new image
    try {
        await fs.writeFile(absolutePath, photoBuffer);
    } catch (error) {
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

// Decode, resize, and re-encode as WebP
const processPhoto = async(photo) => {
    try {
        //Decoding and re-decoding(removing unnecessary metadata)
        const output = await sharp(photo.buffer)
            .resize({
                withoutEnlargement: true, //If the photo is small let it as it is
                width: 800 //otherwise 800pxl
            })
            .webp({quality: 80}) //Change it to webp with 80
            .toBuffer(); //The output should be in bianry(nodejs buffer)

        return output;
    } catch (error) {
        throw AppError("Invalid Photo", 400);
    }
}

//Remove profile picture
const removePhoto = async(userId) => {
    const result = await usersRepo.removePhoto({id: userId});
    throwIfNotFound(result, "Fiald to delete the photo");

    const absolutePath = path.join(process.cwd(), result.avatar);
    await fs.unlink(absolutePath).catch(() => {});

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