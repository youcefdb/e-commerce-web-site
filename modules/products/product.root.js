import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import PERMISSION from "../../config/roles.config.js";
import * as productController from "./product.controller.js";
import express from "express";
import { getProductsSchema, productDetailsSchema } from "./product.validation.js";
import { createProductSchema, updateProductSchema } from "./product.validation.js";
import verifyJwtToken from "../../middleware/jwtVerification.middleware.js";
import roleAuthorize from "../../middleware/roleCheck.middleware.js";

const productRoot = express.Router();

productRoot
    .get("/", schemaValidator({query: getProductsSchema}), productController.getProducts)
    .get("/:id/", schemaValidator({params: productDetailsSchema}), productController.viewProduct)
    .post("/", verifyJwtToken, roleAuthorize(PERMISSION.ADMIN), schemaValidator({body: createProductSchema}), productController.createProduct)
    .patch("/:id", verifyJwtToken, roleAuthorize(PERMISSION.ADMIN), schemaValidator({
        params: productDetailsSchema,
        body: updateProductSchema
    }), productController.updateProduct)
    .delete("/:id", verifyJwtToken, roleAuthorize(PERMISSION.ADMIN), schemaValidator({params: productDetailsSchema}), productController.deleteProduct)

export default productRoot;
