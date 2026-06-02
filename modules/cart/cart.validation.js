import Joi from "joi";

//Schema for adding product to cart
const addProductToCartSchema = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    quantity: Joi.number().integer().max(10).required(),
}).unknown(false);

//Remove product from cart schema
const removeCartProductSchema = Joi.object({
    productId: Joi.string().trim().uuid().required()
}).unknown(false);

//Edit amount of bought product
const editProductQuantitySchema = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    quantity: Joi.number().integer().max(10).required(),
}).unknown(false);


export{
    addProductToCartSchema,
    removeCartProductSchema,
    editProductQuantitySchema
}