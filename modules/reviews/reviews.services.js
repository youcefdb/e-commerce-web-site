import { AppError, throwIfNotFound } from "../../errors/errors.js";
import { buildResponce, getPagination } from "../../utils/responce.util.js";
import withTransaction from "../../utils/transaction.util.js";
import { viewProduct } from "../products/product.repo.js";
import * as reviewsRepo from "./reviews.repo.js";

//get product reviews
const getReviews = async(productId, page, limit) => {
    const result = await reviewsRepo.getReviews(productId);
    throwIfNotFound(result, "Be the first to review this product!");
    const {safePage, safeLimit, offset} = getPagination(page, limit);
    return buildResponce(result, safePage, offset);
}

//Add review to product
const addReview = async (data, userId) => {
    return withTransaction(async(client) => {
        const product = await viewProduct(data.productId, {db: client});
        throwIfNotFound(product, "Product not found");
        const newData = {...data, userId};
        const result = await reviewsRepo.addReview(newData, {db: client});
        return {
            message: "Review added successfully",
            data: result
        }
    });
}

//delete user review from product
const deleteReview = async(reviewId, userId) => {
    return withTransaction(async(client) => {

        const newData = {id:reviewId, userId};
        const result = await reviewsRepo.deleteReview(newData, {db: client});
        throwIfNotFound(result, "Review not found");

        return {
            message: "Review deleted successfully"
        }
    });
}

//Edit review afer submit
const editReview = async(data, reviewId, userId) => {
    return withTransaction(async(client) => {
        var newData = {userId, reviewId};
        console.log(newData.userId, newData.reviewId);
        const review = await reviewsRepo.findReview(newData, {db: client});
        throwIfNotFound(review, "Review not found");
        
        let values = [];
        let params = [];
        let index = 1;

        if (data.comment !== review.comment && data.comment != undefined) {
                params.push(`comment = $${index++}`);
                values.push(data.comment);
            }

        if (data.rating !== review.rating && data.rating != undefined) {
            params.push(`rating = $${index++}`);
            values.push(data.rating);
        }

        if (!params.length) {
            throw AppError("Update at least an attribute", 409);
        }

        values.push(review.id, userId);

        const result = await reviewsRepo.editReview(values, params, {db: client});

        return {
            message: "Review updated successfully",
            data: result
        }
    });
}

export {
    getReviews,
    addReview,
    deleteReview,
    editReview
}