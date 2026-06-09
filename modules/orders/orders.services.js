import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import { findCartByUserId, getCartContent, removeProductFromCart } from "../cart/cart.repo.js";
import {productQuantity, productStock, viewProduct} from "../products/product.repo.js";
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
        
        var totalPrice = 0

        for(const productPrice of data.products){
            var realProduct = await viewProduct(productPrice.id, {db: client});
            if (realProduct.stock >= productPrice.quantity) {
                totalPrice += realProduct.price * productPrice.quantity;
            }else{
                throw AppError(`There are only ${realProduct.stock} of ${realProduct.name}(s)`, 409);
            }
        }

        const order = await ordersRepo.placeOrder(
            {
                userId,
                totalPrice: totalPrice,
                status: 'pending',
                shippingAddress: data.shipping_address,
                paymentMethod: data.paymentMethod,
                paidAt: data.paidAt,
                deliveredAt: null
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

        await removeProductFromCart({userId}, {db: client});

        return {
            message: 'Order placed successfully',
            data: {
                orderId: order.id,
                items
            }
        };
    });
};

const place = async (data, userId) => {
    return withTransaction(async (client) => {
        const cartItems = await getCartContent({userId}, {db: client});

        if (!cartItems.length) {
            throw AppError("Cart is empty", 400);
        }

        let totalPrice = 0;

        for (const item of cartItems) {
            if (item.stock < item.quantity) {
            throw AppError(`There are only ${item.stock} of ${item.name}(s)`, 409);
        }

            totalPrice += item.price * item.quantity;
        }

        const order = await ordersRepo.placeOrder(
            {
                userId,
                totalPrice,
                status: "pending",
                shippingAddress: data.shipping_address,
                paymentMethod: data.paymentMethod,
                paidAt: null,
                deliveredAt: null
            },
            { db: client }
        );

        const placeholders = [];
        const values = [];

        let paramIndex = 1;

        for (const item of cartItems) {
            placeholders.push(
                `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
            );

            values.push(
                order.id,
                item.id,
                item.quantity,
                item.price
            );

            paramIndex += 4;

            await productStock(
                {
                    id: item.id,
                    stock: -item.quantity
                },
                { db: client }
            );
        }

        const items = await ordersRepo.addOrderItems(
            values,
            placeholders.join(", "),
            { db: client }
        );

        await removeProductFromCart({userId}, {db: client}
        );

        return {
            message: "Order placed successfully",
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