import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import PERMISSION from "../../config/roles.config.js";
import * as productController from "./product.controller.js";
import express from "express";
import { getProductsSchema, productDetailsSchema } from "./product.validation.js";
import roleCheckMiddleware from "../../middleware/roleCheck.middleware.js";

const productRoot = express.Router();

productRoot
    .get("/", schemaValidator(getProductsSchema), productController.getProducts)
    .get("/:id/", schemaValidator(productDetailsSchema), productController.viewProduct)

export default productRoot;