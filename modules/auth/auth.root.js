import express from "express";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as authController from "./auth.controller.js";
import { loginValidationSchema, registerValidationSchema } from "./auth.validation.js";

const authRoot = express.Router();

authRoot
    .post("/register", schemaValidator({body: registerValidationSchema}), authController.register)//email + pass + name
    .post("/login", schemaValidator({body: loginValidationSchema}), authController.login)// email + pass
    .get("/google", authController.buildGoogleAuthUrl)
    .get("/google/callback", authController.googleLogin)
    .post("/refresh", authController.refreshAccessToken)//refresh access token
    .post("/logout", authController.logout)//delete refresh token from DB

export default authRoot
