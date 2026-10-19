import joi from "joi";

const updateOrderStatusSchema = joi.object({
    status: joi.string().trim().lowercase().valid(
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
    ).required(),

    id: joi.string().trim().uuid().required()
}).unknown(true);


export {
    updateOrderStatusSchema
}