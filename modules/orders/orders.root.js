import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as orderController from "./orders.controller.js";
import idempotencyKey from "../../middleware/idempotencyKey,middleware.js";
import {
    getOrderDetailsSchema,
    placeOrderSchema,
    updateOrderStatusParamsSchema,
    updateOrderStatusBodySchema
} from "./order.validation.js";
import express from "express";
import roleAuthorize from "../../middleware/roleCheck.middleware.js";
import PERMISSION from "../../config/roles.config.js";

const orderRoot = express.Router();

orderRoot
    .get("/", orderController.getOrder)
    .get("/:id/", schemaValidator({params: getOrderDetailsSchema}), orderController.getOrderDetails)
    .post("/", idempotencyKey, schemaValidator({body: placeOrderSchema}), orderController.placeOrder)
    .patch("/:id", idempotencyKey, roleAuthorize(PERMISSION.ADMIN), schemaValidator({
        params: updateOrderStatusParamsSchema,
        body: updateOrderStatusBodySchema
    }), orderController.updateOrderStatus)

export default orderRoot;
