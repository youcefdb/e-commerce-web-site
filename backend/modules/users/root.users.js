import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import { uploadSingleImage } from "../../config/multer.config.js";
import * as userController from "../users/controller.users.js";
import express from "express";
import { updateUserSchema } from "./validation.users.js";

const userRoot = express.Router();

userRoot
    .get("/me", userController.viewProfile)
    .patch("/me", schemaValidator({body: updateUserSchema}), userController.updateUser)
    .post("/image", uploadSingleImage, userController.uploadProfilePic)
    .delete("/me", userController.removePhoto)

export default userRoot;
