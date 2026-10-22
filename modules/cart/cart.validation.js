import Joi from "joi";

//Schema for adding product to cart
const addProductToCartSchema = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    quantity: Joi.number().integer().positive().max(10).required(),
}).unknown(false);

//Remove product from cart schema
const cartItemParamsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

//Edit amount of a product in the request body
const editProductQuantitySchema = Joi.object({
    quantity: Joi.number().integer().min(1).max(10).required(),
}).unknown(false);


export{
    addProductToCartSchema,
    cartItemParamsSchema,
    editProductQuantitySchema
}
