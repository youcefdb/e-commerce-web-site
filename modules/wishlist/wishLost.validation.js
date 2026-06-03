import Joi from "joi";

//Schema for get wishe list
const getWishListSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
}).unknown(false);

const addToWishListSchema = Joi.object({
    productId: Joi.string().trim().uuid().required()
}).unknown(false);

const delteFromWishlistSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);


export{
    getWishListSchema,
    addToWishListSchema,
    delteFromWishlistSchema
}