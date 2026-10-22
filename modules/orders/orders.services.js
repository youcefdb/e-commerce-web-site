import { AppError, throwIfNotFound } from "../../errors/errors.js";
import { getPagination } from "../../utils/responce.util.js";
import withTransaction from "../../utils/transaction.util.js";
import { addIdempotencyKey, completeIdempotencyKey, getIdempotencyKey } from "../auth/auth.repo.js";
import {deleteFromCarts} from "../cart/cart.repo.js";
import {getProductsByIdsForUpdate, productStock, restoreProductStock} from "../products/product.repo.js";
import * as ordersRepo from "./orders.repo.js";
import { canTransitionOrder } from "./order.lifecycle.js";
import {
    DEFAULT_ORDERS_PAGE_SIZE,
    MAX_ORDERS_PAGE,
    MAX_ORDERS_PAGE_SIZE
} from "./orders.pagination.js";

//Get user order
const getOrders = async (userId, page = 1, limit = DEFAULT_ORDERS_PAGE_SIZE) => {
    if (!Number.isSafeInteger(page) || page < 1 || page > MAX_ORDERS_PAGE) {
        throw AppError("Invalid page", 400);
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_ORDERS_PAGE_SIZE) {
        throw AppError("Invalid limit", 400);
    }

    const {safeLimit, offset} = getPagination(page, limit);
    const result = await ordersRepo.getOrders(userId, safeLimit, offset);

    return {
        data: result.data,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(result.totalCount / safeLimit),
        totalCount: result.totalCount
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

// Restore only the quantities persisted with this order. The caller must hold
// the order row lock and run this in the same transaction as the status update.
const restoreOrderInventory = async(orderId, ctx) => {
    const orderItems = await ordersRepo.getOrderInventory(orderId, ctx);

    for (const item of orderItems) {
        const result = await restoreProductStock({
            id: item.product_id,
            quantity: item.quantity
        }, ctx);
        throwIfNotFound(result, "Product not found");
    }
}

// Customer cancellation is restricted by the same lifecycle rules as admin
// status changes. Locking the order serializes concurrent cancellation attempts.
const cancelOrder = async(orderId, userId) => {
    return withTransaction(async(client) => {
        const order = await ordersRepo.findUserOrderForUpdate({orderId, userId}, {db: client});
        throwIfNotFound(order, "Order not found");

        if (!canTransitionOrder(order.status, "cancelled")) {
            throw AppError(`Cannot change order status from ${order.status} to cancelled`, 409);
        }

        const updatedOrder = await ordersRepo.updateUserOrderStatus({
            orderId,
            userId,
            currentStatus: order.status,
            status: "cancelled"
        }, {db: client});
        throwIfNotFound(updatedOrder, "Order not found");

        await restoreOrderInventory(orderId, {db: client});

        return {message: "Order cancelled successfully"};
    });
}

//Create order
const placeOrder = async (data, userId, idKey, requestHash) => {
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

    if (!idKey || !requestHash) {
        throw AppError("Idempotency key is required", 400);
    }

    return withTransaction(async (client) => {
        const reservation = await addIdempotencyKey({
            userId,
            idKey,
            requestHash,
            status: "in_progress"
        }, {db: client});

        if (!reservation) {
            const existing = await getIdempotencyKey({userId, idKey}, {db: client});
            if (!existing) {
                throw AppError("Unable to resolve idempotency key; retry the request", 409);
            }
            if (existing.request_hash !== requestHash) {
                throw AppError("Idempotency key was already used with a different request", 409);
            }
            if (existing.status === "completed" && existing.response_status && existing.response_body !== null) {
                return existing.response_body;
            }

            throw AppError("Request is already being processed", 409);
        }

        const productIds = productsList.map(product => product.productId);
        const products = await getProductsByIdsForUpdate(productIds, {db: client});
        const productsById = new Map(products.map(product => [product.id, product]));
        var totalPrice = 0

        for (const productPrice of productsList) {
            const productId = productPrice.productId;
            const realProduct = productsById.get(productId);
            throwIfNotFound(realProduct, "Product not found");
            if (realProduct.stock >= productPrice.quantity) {
                totalPrice += parseFloat(realProduct.price) * productPrice.quantity;
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
            const realProduct = productsById.get(productId);

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

        const responseBody = {
            message: 'Order placed successfully',
            data: {
                orderId: order.id,
                items
            }
        };

        const completed = await completeIdempotencyKey({
            userId,
            idKey,
            requestHash,
            responseStatus: 200,
            responseBody
        }, {db: client});
        if (!completed) {
            throw AppError("Failed to store idempotency response", 500);
        }

        return responseBody;
    });
};

export {
    getOrders,
    getOrderDetails,
    placeOrder,
    cancelOrder,
    restoreOrderInventory
}
