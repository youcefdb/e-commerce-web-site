import asyncHandler from '../../utils/tryCatch.util.js';
import * as adminRepo from "../admin/admin.services.js";

const updateOrderStatus = asyncHandler(async (req, res) => {
    const result = await adminRepo.updateOrderStatus(req.body, req.params.id, req.idempotencyKey);
    return res.status(200).json(result);
});


export {
    updateOrderStatus
}