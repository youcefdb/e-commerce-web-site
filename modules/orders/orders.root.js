import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as orderController from "./orders.controller.js";
import {getOrderDetailsSchema, placeOrderSchema, updateOrderStatusSchema} from "./order.validation.js";
import express from "express";

const orderRoot = express.Router();

orderRoot
    .get("/", orderController.getOrder)
    .get("/:id/", schemaValidator(getOrderDetailsSchema), orderController.getOrderDetails)
    .post("/", schemaValidator(placeOrderSchema), orderController.placeOrder)
    .patch("/:id", schemaValidator(updateOrderStatusSchema), orderController.updateOrderStatus)

export default orderRoot;