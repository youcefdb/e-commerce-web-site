import Joi from "joi";

//get reviews schema
const getReviewsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

//add review schema
const addReviewSchema = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().min(2).max(500)
}).unknown(false);


//Delete review schema
const deleteReviewSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);


//Edit review schema
const editReviewSchema = Joi.object({
    id: Joi.string().trim().uuid().required(),
    rating: Joi.number().min(1).max(5).optional(),
    comment: Joi.string().trim().min(2).max(500).optional()
}).unknown(false);

export {
    getReviewsSchema,
    addReviewSchema,
    deleteReviewSchema,
    editReviewSchema
}