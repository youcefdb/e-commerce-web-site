import express from "express";
import * as cartController from "./cart.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as productSchema from "./cart.validation.js";

const cartRoot = express.Router();

cartRoot
    .get("/", cartController.getCartContent)
    .post("/items", schemaValidator({body: productSchema.addProductToCartSchema}), cartController.addProductToCart)
    .patch("/items/:id", schemaValidator({
        params: productSchema.cartItemParamsSchema,
        body: productSchema.editProductQuantitySchema
    }), cartController.editProductQuantity)
    .delete("/items/:id", schemaValidator({params: productSchema.cartItemParamsSchema}),cartController.removeProductFromCart)

export default cartRoot;
