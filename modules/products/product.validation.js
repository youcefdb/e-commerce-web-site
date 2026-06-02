import Joi from "joi";

//Schema for getting products
const getProductsSchema = Joi.object({
    search: Joi.string().trim(),
    minPrice: Joi.number(),
    maxPrice: Joi.number().min(Joi.ref("minPrice")),
    category: Joi.string().trim().uuid(),
    sort: Joi.string().valid("price", "newest", "rating"),
    order: Joi.string().valid("asc", "desc"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

//Schema for getting product details
const productDetailsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);


export {
    getProductsSchema,
    productDetailsSchema
}