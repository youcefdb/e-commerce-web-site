import joi from "joi";
import { orderStatuses } from "../orders/order.validation.js";

const updateOrderStatusParamsSchema = joi.object({
    id: joi.string().trim().uuid().required()
}).unknown(false);

const updateOrderStatusBodySchema = joi.object({
    status: joi.string().trim().lowercase().valid(...orderStatuses).required()
}).unknown(false);

const adminListQuerySchema = joi.object().max(0);


export {
    updateOrderStatusParamsSchema,
    updateOrderStatusBodySchema,
    adminListQuerySchema
}
