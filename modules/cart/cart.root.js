import express from "express";
import * as cartController from "./cart.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as productSchema from "./cart.validation.js";

const cartRoot = express.Router();

cartRoot
    .get("/", cartController.getCartContent)
    .post("/", schemaValidator(productSchema.addProductToCartSchema), cartController.addProductToCart)
    .delete("/", schemaValidator(productSchema.removeCartProductSchema),cartController.removeCartProducts)
    .patch("/", schemaValidator(productSchema.editProductQuantitySchema), cartController.editProductQuantity)

export default cartRoot;