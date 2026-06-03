import { throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import * as ordersRepo from "./orders.repo.js";

//Get user order
const getOrders = async (userId) => {
    const result = await ordersRepo.getOrders(userId);
    throwIfNotFound(result, "No orders found");

    return {
        data: result
    }
}

//Get user order details
const getOrderDetails = async(orderId, userId) => {
    const newData = {userId, orderId};
    const order = await ordersRepo.getOrderDetails(newData);
    throwIfNotFound(order.length, "No orders found");
    return {
        data: order
    }
}

//Create order
const placeOrder = async (data, userId) => {
    return withTransaction(async (client) => {
        const order = await ordersRepo.placeOrder(
            {
                userId,
                totalPrice: data.totalPrice,
                status: data.status,
                shippingAddress: data.shipping_address,
                paymentMethod: data.paymentMethod,
                paidAt: data.paidAt,
                deliveredAt: data.deliveredAt
            },
            { db: client }
        );

        const placeholders = [];
        const values = [];

        let paramIndex = 1;
        for (const product of data.products) {
            placeholders.push(
                `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
            );

            values.push(
                order.id,
                product.productId,
                product.quantity,
                product.price
            );
            paramIndex += 4;
        }

        const items = await ordersRepo.addOrderItems(values,
            placeholders.join(', '),
            { db: client }
        );

        return {
            message: 'Order placed successfully',
            data: {
                orderId: order.id,
                items
            }
        };
    });
};


export {
    getOrders,
    getOrderDetails,
    placeOrder
}