import express from "express";
import * as cartController from "./cart.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as productSchema from "./cart.validation.js";

const cartRoot = express.Router();

cartRoot
    .get("/v1/", cartController.getCartContent)
    .post("/v1/", schemaValidator(productSchema.addProductToCartSchema), cartController.addProductToCart)
    .patch("/v1/", schemaValidator(productSchema.editProductQuantitySchema), cartController.editProductQuantity)
    .delete("/v1/", schemaValidator(productSchema.removeCartProductSchema),cartController.removeProductFromCart)

export default cartRoot;