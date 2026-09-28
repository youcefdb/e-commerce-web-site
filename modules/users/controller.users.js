import * as userServices from "../users/services.users.js";
import fs from "fs/promises";

//Update user profile
const updateUser = async (req, res) => {
    try {
        const result = await userServices.updateUser(req.user.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Get user profile
const viewProfile = async(req, res) => {
    try {
        const result = await userServices.viewProfile(req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

const uploadProfilePic = async(req, res) => {
    try {
        const result = await userServices.uploadProfilePic(req.file, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}


export{
    updateUser,
    viewProfile,
    uploadProfilePic
}