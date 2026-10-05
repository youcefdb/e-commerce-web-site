import asyncHandler from "../../utils/tryCatch.util.js";
import * as orderController from "./orders.services.js";

//Get user order
const getOrder = asyncHandler(async(req, res) => {
    const result = await orderController.getOrders(req.user.id);
    return res.status(200).json(result);
})

//Getr user order details
const getOrderDetails = asyncHandler(async(req, res) => {
    const result = await orderController.getOrderDetails(req.params.id, req.user.id);
    return res.status(200).json(result);
})

//create order
const placeOrder = asyncHandler(async(req, res) => {
    const result = await orderController.placeOrder(req.body, req.user.id);
    return res.status(200).json(result);
});

//Update order status
const updateOrderStatus = asyncHandler(async(req, res) => {
    const result = await orderController.updateOrderStatus(req.body, req.params.id, req.user.id);
    return res.status(200).json(result);
});

export {
    getOrder,
    getOrderDetails,
    placeOrder,
    updateOrderStatus
}