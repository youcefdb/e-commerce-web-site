import Joi from "joi";

//Schema for adding product to cart
const addProductToCartSchema = Joi.object({
    cartId: Joi.string().trim().uuid().required(),
    productId: Joi.string().trim().uuid().required(),
    quantity: Joi.number().integer().max(10).required(),
}).unknown(true);

//Remove product from cart schema
const removeCartProductSchema = Joi.object({
    userId: Joi.string().trim().uuid().required(),
    productId: Joi.string().trim().uuid().required()
}).unknown(true);

//Edit amount of bought product
const editProductQuantitySchema = Joi.object({
    userId: Joi.string().trim().uuid().required(),
    productId: Joi.string().trim().uuid().required(),
    quantity: Joi.number().integer().max(10).required(),
}).unknown(true);


export{
    addProductToCartSchema,
    removeCartProductSchema,
    editProductQuantitySchema
}