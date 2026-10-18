import { AppError, throwIfNotFound } from "../../errors/errors.js";
import { buildResponce, getPagination } from "../../utils/responce.util.js";
import withTransaction from "../../utils/transaction.util.js";
import { lockProduct, updateProduct } from "../products/product.repo.js";
import * as reviewsRepo from "./reviews.repo.js";

//get product reviews
const getReviews = async(productId, page, limit) => {
    const {safePage, safeLimit, offset} = getPagination(page, limit);
    const result = await reviewsRepo.getReviews({productId, limit: safeLimit, offset});
    return buildResponce(result.data, safePage, offset, result.totalCount);
}

//Add review to product
const addReview = async (data, userId) => {
    return withTransaction(async(client) => {
        const product = await lockProduct(data.productId, {db: client});
        throwIfNotFound(product, "Product not found");

        const newData = {...data, userId};
        const result = await reviewsRepo.addReview(newData, {db: client});
        await updateProduct(data.productId, {db: client});
        return {
            message: "Review added successfully",
            data: result
        }
    });
}

//delete user review from product
const deleteReview = async(reviewId, userId) => {
    return withTransaction(async(client) => {
        const existingReview = await reviewsRepo.getReview({reviewId, userId}, {db: client});
        throwIfNotFound(existingReview, "Review not found");

        throwIfNotFound(await lockProduct(existingReview.product_id, {db: client}), "Review not found");
        const review = await reviewsRepo.findReview({reviewId, userId}, {db: client});
        throwIfNotFound(review, "Review not found");
        const result = await reviewsRepo.deleteReview({id: reviewId, userId}, {db: client});
        throwIfNotFound(result, "Review not found");
        await updateProduct(review.product_id, {db: client});

        return {
            message: "Review deleted successfully"
        }
    });
}

//Edit review afer submit
const editReview = async(data, reviewId, userId) => {
    return withTransaction(async(client) => {
        const existingReview = await reviewsRepo.getReview({userId, reviewId}, {db: client});
        throwIfNotFound(existingReview, "Review not found");
        throwIfNotFound(await lockProduct(existingReview.product_id, {db: client}), "Review not found");

        const review = await reviewsRepo.findReview({userId, reviewId}, {db: client});
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
        if (data.rating !== undefined && data.rating !== review.rating) {
            await updateProduct(review.product_id, {db: client});
        }

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
