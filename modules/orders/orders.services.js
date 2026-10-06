import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import {deleteFromCarts, getCartContent, removeProductFromCart } from "../cart/cart.repo.js";
import {productStock, viewProduct} from "../products/product.repo.js";
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
        const productsList = data.products.items || data.product || [];
        const resolvedProducts = {};
        var totalPrice = 0

        for (const productPrice of productsList) {
            const productId = productPrice.id || productPrice.productId;
            var realProduct = await viewProduct(productId, {db: client});
            throwIfNotFound(realProduct, "Product not found");
            if (realProduct.stock >= productPrice.quantity) {
                totalPrice += parseFloat(realProduct.price) * productPrice.quantity;
                resolvedProducts[productId] = realProduct;
            } else {
                throw AppError(`There are only ${realProduct.stock} of ${realProduct.name}(s)`, 409);
            }
        }

        const order = await ordersRepo.placeOrder(
            {
                userId,
                totalPrice: totalPrice,
                status: 'pending',
                shippingAddress: data.shippingAddress || data.shipping_address,
                paymentMethod: data.paymentMethod,
                paidAt: data.paidAt || new Date().toISOString(),
                deliveredAt: null
            },
            { db: client }
        );

        const placeholders = [];
        const values = [];
        let paramIndex = 1;


        const deletePlaceHolder = [];
        const deleteValues = [];
        let deleteParamIndex = 1;

        for (const product of productsList) {
            const productId = product.id || product.productId;
            const realProduct = resolvedProducts[productId];

            placeholders.push(
                `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
            );

            deletePlaceHolder.push(
                `$${deleteParamIndex++}`
            )
            
            values.push(
                order.id,
                productId,
                product.quantity,
                realProduct.price
            );
            paramIndex += 4;

            deleteValues.push(productId);

            // Deduct stock in DB
            const result = await productStock(
                {
                    id: productId,
                    stock: realProduct.stock - product.quantity
                },
                {db: client}
            );

            throwIfNotFound(result, "Insufficient stock");
        }

        const items = await ordersRepo.addOrderItems(values,
            placeholders.join(', '),
            { db: client }
        );

        await deleteFromCarts({
            deletePlaceHolder: deletePlaceHolder.join(","),
            deleteValues
        });

        // Clear user cart content in DB
        // await removeProductFromCart({userId}, {db: client});

        return {
            message: 'Order placed successfully',
            data: {
                orderId: order.id,
                items
            }
        };
    });
};

//Update order status
const updateOrderStatus = async(data, id, userId) => {
    return withTransaction(async(client) => {
        const newData = {status: data.status, id, userId };
        const result = await ordersRepo.updateOrderStatus(newData, {db: client});
        throwIfNotFound(result, "Order not found");

        return{
            message: "Status updated successfully"
        }
    });
}

export {
    getOrders,
    getOrderDetails,
    placeOrder,
    updateOrderStatus
}