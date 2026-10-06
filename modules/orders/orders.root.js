import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as orderController from "./orders.controller.js";
import {getOrderDetailsSchema, placeOrderSchema, updateOrderStatusSchema} from "./order.validation.js";
import express from "express";
import roleAuthorize from "../../middleware/roleCheck.middleware.js";
import PERMISSION from "../../config/roles.config.js";

const orderRoot = express.Router();

orderRoot
    .get("/", orderController.getOrder)
    .get("/:id/", schemaValidator(getOrderDetailsSchema), orderController.getOrderDetails)
    .post("/", schemaValidator(placeOrderSchema), orderController.placeOrder)
    .patch("/:id", roleAuthorize(PERMISSION.ADMIN), schemaValidator(updateOrderStatusSchema), orderController.updateOrderStatus)

export default orderRoot;