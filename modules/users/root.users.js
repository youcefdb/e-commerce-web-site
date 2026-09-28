import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import upload from "../../config/multer.config.js";
import * as userController from "../users/controller.users.js";
import express from "express";
import { updateUserSchema } from "./validation.users.js";

const userRoot = express.Router();

userRoot
    .post("/image", upload.single("image"), userController.uploadProfilePic)
    .get("/me", userController.viewProfile)
    .patch("/me", schemaValidator(updateUserSchema), userController.updateUser)

export default userRoot;