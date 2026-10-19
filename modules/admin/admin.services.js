import * as orderRepo from '../admin/admin.repo.js';

//Update order status
const updateOrderStatus = async(data, orderId, idKey) => {
    return withTransaction(async(client) => {
        const newData = {status: data.status, id: orderId, userId };
        const result = await orderRepo.updateOrderStatus(newData, {db: client});
        throwIfNotFound(result, "Order not found");

        const keyIdempotencyData = {
            userId,
            idKey,
            status: "completed"
        }

        const storeKey = await addIdempotencyKey(keyIdempotencyData, {db: client});
        if(!storeKey){
            throw AppError("Failed to store idempotency key", 500);
        }

        return{
            message: "Status updated successfully"
        }
    });
}
//Add admin APIs

export{
    updateOrderStatus
}