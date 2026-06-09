import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as userController from "../users/controller.users.js";
import express from "express";
import { updateUserSchema } from "./validation.users.js";

const userRoot = express.Router();

userRoot
    .get("/profile/v1/", userController.viewProfile)
    .patch("/update/v1/", schemaValidator(updateUserSchema), userController.updateUser)


export default userRoot;