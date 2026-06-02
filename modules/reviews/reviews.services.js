import { throwIfNotFound } from "../../errors/errors.js";
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

export {
    getReviews,
    addReview
}