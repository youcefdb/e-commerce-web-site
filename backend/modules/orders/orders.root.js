import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as orderController from "./orders.controller.js";
import idempotencyKey from "../../middleware/idempotencyKey,middleware.js";
import {
    getOrdersQuerySchema,
    getOrderDetailsSchema,
    placeOrderSchema
} from "./order.validation.js";
import express from "express";

const orderRoot = express.Router();

orderRoot
    .get("/", schemaValidator({query: getOrdersQuerySchema}), orderController.getOrder)
    .get("/:id/", schemaValidator({params: getOrderDetailsSchema}), orderController.getOrderDetails)
    .post("/:id/cancel", schemaValidator({params: getOrderDetailsSchema}), orderController.cancelOrder)
    .post("/", schemaValidator({body: placeOrderSchema}), idempotencyKey, orderController.placeOrder)

export default orderRoot;
