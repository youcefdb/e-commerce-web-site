import * as orderRepo from '../admin/admin.repo.js';
import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import {
    addIdempotencyKey,
    completeIdempotencyKey,
    getIdempotencyKey
} from "../auth/auth.repo.js";
import { canTransitionOrder } from "../orders/order.lifecycle.js";
import { restoreOrderInventory } from "../orders/orders.services.js";

const getStats = () => orderRepo.getAdminStats();

const getOrders = () => orderRepo.getAdminOrders();

const getUsers = () => orderRepo.getAdminUsers();

//Update order status
const updateOrderStatus = async(data, orderId, userId, idKey, requestHash) => {
    if (!idKey || !requestHash) {
        throw AppError("Idempotency key is required", 400);
    }

    return withTransaction(async(client) => {
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

        const order = await orderRepo.findOrderForUpdate(orderId, {db: client});
        throwIfNotFound(order, "Order not found");

        if (!canTransitionOrder(order.status, data.status)) {
            throw AppError(`Cannot change order status from ${order.status} to ${data.status}`, 409);
        }

        const result = await orderRepo.updateOrderStatus({
            status: data.status,
            id: orderId,
            currentStatus: order.status
        }, {db: client});
        throwIfNotFound(result, "Order not found");

        if (data.status === "cancelled") {
            await restoreOrderInventory(orderId, {db: client});
        }

        const responseBody = {
            message: "Status updated successfully"
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
}
//Add admin APIs

export{
    getStats,
    getOrders,
    getUsers,
    updateOrderStatus
}
