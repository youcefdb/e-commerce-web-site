import asyncHandler from "../../middleware/tryCatch.middleware.js";
import * as reviewsServices from "./reviews.services.js";

//get product reviews by id
const getReviews = asyncHandler(async(req, res) => {
    const result = await reviewsServices.getReviews(req.params.id, req.query.page, req.query.limit);
    return res.status(200).json(result);
});

//add review to a product
const addReview = asyncHandler(async(req, res) => {
    const result = await reviewsServices.addReview(req.body, req.user.id);
    return res.status(200).json(result);
})

//Edit review
const editReview = asyncHandler(async(req, res) => {
    const result = await reviewsServices.editReview(req.body, req.params.id, req.user.id);
        return res.status(200).json(result);
});

//Delete review
const deleteReview = asyncHandler(async(req, res) => {
    const result = await reviewsServices.deleteReview(req.params.id, req.user.id);
    return res.status(200).json(result);
});

export{
    getReviews,
    addReview,
    editReview,
    deleteReview
}