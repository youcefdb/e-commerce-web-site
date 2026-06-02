import Joi from "joi";

//get reviews schema
const getReviewsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

//add review schema
const addReviewSchema = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().max(500)
}).unknown(false);


export {
    getReviewsSchema,
    addReviewSchema
}