import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as productController from "./product.controller.js";
import express from "express";
import { getProductsSchema, productDetailsSchema } from "./product.validation.js";

const productRoot = express.Router();

productRoot
    .get("/v1/", schemaValidator(getProductsSchema), productController.getProducts)
    .get("/:id/v1/", schemaValidator(productDetailsSchema), productController.viewProduct)

export default productRoot;