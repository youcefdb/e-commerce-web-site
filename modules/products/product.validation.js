import Joi from "joi";
import { MAX_PAGE, MAX_PAGE_SIZE } from "../../utils/responce.util.js";

//Schema for getting products
const getProductsSchema = Joi.object({
    search: Joi.string().trim(),
    minPrice: Joi.number(),
    maxPrice: Joi.number().min(Joi.ref("minPrice")),
    category: Joi.string().trim().uuid(),
    sort: Joi.string().valid("price", "newest", "rating"),
    order: Joi.string().valid("asc", "desc"),
    page: Joi.number().integer().min(1).max(MAX_PAGE).default(1),
    limit: Joi.number().integer().min(1).max(MAX_PAGE_SIZE).default(20),
}).unknown(false);

//Schema for getting product details
const productDetailsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

const productFields = {
    name: Joi.string().trim().min(1).max(255),
    description: Joi.string().allow("").max(10000),
    price: Joi.number().precision(2).strict().min(0).max(9999999999.99),
    stock: Joi.number().integer().min(0).max(2147483647),
    image: Joi.string().trim().allow("").max(2048),
    category: Joi.string().trim().min(1).max(140)
};

const createProductSchema = Joi.object({
    ...productFields,
    name: productFields.name.required(),
    description: productFields.description.required(),
    price: productFields.price.required(),
    stock: productFields.stock.required(),
    category: productFields.category.required()
}).unknown(false);

const updateProductSchema = Joi.object(productFields).min(1).unknown(false);


export {
    getProductsSchema,
    productDetailsSchema,
    createProductSchema,
    updateProductSchema
}
