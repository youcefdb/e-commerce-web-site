import asyncHandler from "../../middleware/tryCatch.middleware.js";
import * as userServices from "../users/services.users.js";

//Update user profile
const updateUser = asyncHandler(async(req, res) => {
    const result = await userServices.updateUser(req.user.id, req.body);
    return res.status(200).json(result);
});

//Get user profile
const viewProfile = asyncHandler(async(req, res) => {
    const result = await userServices.viewProfile(req.user.id);
    return res.status(200).json(result);
})

//Upload profile picture
const uploadProfilePic = asyncHandler(async(req, res) => {
    const result = await userServices.uploadProfilePic(req.file, req.user.id);
    return res.status(200).json(result);
});

//Remove profile picture
const removePhoto = asyncHandler(async(req, res) => {
    const result = await userServices.removePhoto(req.user.id);
    return res.status(204).json(result);
})

export{
    updateUser,
    viewProfile,
    uploadProfilePic,
    removePhoto
}