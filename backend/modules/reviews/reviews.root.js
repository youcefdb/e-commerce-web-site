import express from "express";
import * as reviewController from "./reviews.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import {
    addReviewSchema,
    deleteReviewSchema,
    editReviewSchema,
    editReviewParamsSchema,
    getReviewsParamsSchema,
    getReviewsQuerySchema
} from "./reviews.validation.js";
import verifyJwtToken from "../../middleware/jwtVerification.middleware.js";

const reviewRoot = express.Router();

reviewRoot
    .post("/", verifyJwtToken, schemaValidator({body: addReviewSchema}) ,reviewController.addReview)
    .get("/:id/", schemaValidator({
        params: getReviewsParamsSchema,
        query: getReviewsQuerySchema
    }), reviewController.getReviews)
    .patch("/:id/", verifyJwtToken, schemaValidator({
        params: editReviewParamsSchema,
        body: editReviewSchema
    }), reviewController.editReview)
    .delete("/:id/", verifyJwtToken, schemaValidator({params: deleteReviewSchema}), reviewController.deleteReview)

export default reviewRoot;
