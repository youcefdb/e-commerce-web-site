import express from "express";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as authController from "./auth.controller.js";
import { loginValidationSchema, registerValidationSchema } from "./auth.validation.js";
import { resendVerificationSchema, verifyEmailQuerySchema } from "./auth.validation.js";
import verifyJwtToken from "../../middleware/jwtVerification.middleware.js";
import roleAuthorize from "../../middleware/roleCheck.middleware.js";
import PERMISSION from "../../config/roles.config.js";

const authRoot = express.Router();

authRoot
    .post("/register", schemaValidator({body: registerValidationSchema}), authController.register)//email + pass + name
    .post("/login", schemaValidator({body: loginValidationSchema}), authController.login)// email + pass
    .post("/verification/resend", schemaValidator({body: resendVerificationSchema}), authController.resendVerification)
    .get("/verify-email", schemaValidator({query: verifyEmailQuerySchema}), authController.verifyEmail)
    .get("/google", authController.buildGoogleAuthUrl)
    .post("/google/link", verifyJwtToken, roleAuthorize(PERMISSION.CUSTOMER, PERMISSION.ADMIN), authController.startGoogleLink)
    .get("/google/callback", authController.googleLogin)
    .post("/refresh", authController.refreshAccessToken)//refresh access token
    .post("/logout", authController.logout)//delete refresh token from DB

export default authRoot
