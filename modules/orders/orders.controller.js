import * as orderController from "./orders.services.js";

//Get user order
const getOrder = async() => {
    try {
        const result = await orderController.getOrders(req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Getr user order details
const getOrderDetails = async() =>{
    try {
        const result = await orderController.getOrderDetails(req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}


//create order
const placeOrder = async(req, res) => {
    try {
        const result = await orderController.placeOrder(req.body, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

export {
    getOrder,
    getOrderDetails,
    placeOrder
}