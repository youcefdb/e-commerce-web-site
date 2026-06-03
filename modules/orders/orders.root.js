import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as orderController from "./orders.controller.js";
import {getOrderDetailsSchema} from "./order.validation.js";
import express from "express";

const orderRoot = express.Router();

orderRoot
    .get("/", orderController.getOrder)
    .get("/:id", schemaValidator(getOrderDetailsSchema), orderController.getOrderDetails)
    .post("/", orderController.placeOrder)

export default orderRoot;