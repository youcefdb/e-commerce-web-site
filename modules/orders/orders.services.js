import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import { addIdempotencyKey } from "../auth/auth.repo.js";
import {deleteFromCarts} from "../cart/cart.repo.js";
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
const placeOrder = async (data, userId, idKey) => {
    const hasSingleProduct = data && Object.hasOwn(data, "product");
    const hasProductList = data && Object.hasOwn(data, "products");
    const productsList = hasProductList
        ? (Array.isArray(data.products?.items) ? data.products.items : null)
        : hasSingleProduct
            ? [data.product]
            : null;

    const isValidProduct = (product) =>
        product &&
        typeof product.productId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.productId) &&
        Number.isInteger(product.quantity) &&
        product.quantity > 0 &&
        product.quantity <= 10;

    if (hasSingleProduct === hasProductList || !Array.isArray(productsList) || productsList.length === 0 || !productsList.every(isValidProduct)) {
        throw AppError("Invalid order products", 400);
    }

    return withTransaction(async (client) => {
        const resolvedProducts = {};
        var totalPrice = 0

        for (const productPrice of productsList) {
            const productId = productPrice.productId;
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


        for (const product of productsList) {
            const productId = product.productId;
            const realProduct = resolvedProducts[productId];

            placeholders.push(
                `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
            );

            values.push(
                order.id,
                productId,
                product.quantity,
                realProduct.price
            );
            paramIndex += 4;
        }

        // Lock product rows in a consistent order to reduce deadlocks.
        const productsForStockUpdate = [...productsList].sort((a, b) => {
            const productIdA = a.productId;
            const productIdB = b.productId;
            return productIdA.localeCompare(productIdB);
        });

        for (const product of productsForStockUpdate) {
            const productId = product.productId;
            const result = await productStock(
                {
                    id: productId,
                    stock: product.quantity,
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
            userId,
            productIds: productsList.map(product => product.productId)
        }, { db: client });

        // Clear user cart content in DB
        // await removeProductFromCart({userId}, {db: client});

        const keyIdempotencyData = {
            userId,
            idKey,
            status: "completed"
        }

        const storeKey = await addIdempotencyKey(keyIdempotencyData, {db: client});
        if(!storeKey){
            throw AppError("Failed to store idempotency key", 500);
        }

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
    placeOrder,
    updateOrderStatus
}
