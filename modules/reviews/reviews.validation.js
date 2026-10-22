import Joi from "joi";
import { MAX_PAGE, MAX_PAGE_SIZE } from "../../utils/responce.util.js";

//get reviews schema
const getReviewsParamsSchema = Joi.object({
    id: Joi.string().trim().uuid().required(),
}).unknown(false);

const getReviewsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).max(MAX_PAGE).default(1),
    limit: Joi.number().integer().min(1).max(MAX_PAGE_SIZE).default(20)
}).unknown(false);

//add review schema
const addReviewSchema = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(2).max(500)
}).unknown(false);


//Delete review schema
const deleteReviewSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);


//Edit review schema
const editReviewParamsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

const editReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().trim().min(2).max(500).optional()
}).unknown(false);

export {
    getReviewsParamsSchema,
    getReviewsQuerySchema,
    addReviewSchema,
    deleteReviewSchema,
    editReviewParamsSchema,
    editReviewSchema
}
