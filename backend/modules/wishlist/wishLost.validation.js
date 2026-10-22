import Joi from "joi";
import {
    DEFAULT_WISHLIST_PAGE_SIZE,
    MAX_WISHLIST_PAGE,
    MAX_WISHLIST_PAGE_SIZE
} from "./wishlist.pagination.js";

//Schema for get wishe list
const getWishListSchema = Joi.object({
    page: Joi.number().integer().min(1).max(MAX_WISHLIST_PAGE).default(1),
    limit: Joi.number().integer().min(1).max(MAX_WISHLIST_PAGE_SIZE).default(DEFAULT_WISHLIST_PAGE_SIZE),
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
