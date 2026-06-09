import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as orderController from "./orders.controller.js";
import {getOrderDetailsSchema} from "./order.validation.js";
import express from "express";

const orderRoot = express.Router();

orderRoot
    .get("/v1/", orderController.getOrder)
    .get("/:id/v1/", schemaValidator(getOrderDetailsSchema), orderController.getOrderDetails)
    .post("/v1/", orderController.placeOrder)

export default orderRoot;