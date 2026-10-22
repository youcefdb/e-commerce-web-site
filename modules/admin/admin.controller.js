import asyncHandler from '../../utils/tryCatch.util.js';
import * as adminServices from "../admin/admin.services.js";

const getStats = asyncHandler(async (req, res) => {
    const result = await adminServices.getStats();
    return res.status(200).json(result);
});

const getOrders = asyncHandler(async (req, res) => {
    const result = await adminServices.getOrders();
    return res.status(200).json(result);
});

const getUsers = asyncHandler(async (req, res) => {
    const result = await adminServices.getUsers();
    return res.status(200).json(result);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const result = await adminServices.updateOrderStatus(
        req.body,
        req.params.id,
        req.user.id,
        req.idempotencyKey,
        req.idempotencyHash
    );
    return res.status(200).json(result);
});


export {
    getStats,
    getOrders,
    getUsers,
    updateOrderStatus
}
