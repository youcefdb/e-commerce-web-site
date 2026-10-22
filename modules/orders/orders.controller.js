import asyncHandler from "../../utils/tryCatch.util.js";
import * as orderController from "./orders.services.js";

//Get user order
const getOrder = asyncHandler(async(req, res) => {
    const result = await orderController.getOrders(
        req.user.id,
        req.validatedQuery.page,
        req.validatedQuery.limit
    );
    return res.status(200).json(result);
})

//Getr user order details
const getOrderDetails = asyncHandler(async(req, res) => {
    const result = await orderController.getOrderDetails(req.params.id, req.user.id);
    return res.status(200).json(result);
})

//create order
const placeOrder = asyncHandler(async(req, res) => {
    const result = await orderController.placeOrder(req.body, req.user.id, req.idempotencyKey, req.idempotencyHash);
    return res.status(200).json(result);
});

const cancelOrder = asyncHandler(async(req, res) => {
    const result = await orderController.cancelOrder(req.params.id, req.user.id);
    return res.status(200).json(result);
});

export {
    getOrder,
    getOrderDetails,
    placeOrder,
    cancelOrder
}
