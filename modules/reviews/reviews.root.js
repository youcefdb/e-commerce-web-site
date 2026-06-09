import express from "express";
import * as reviewController from "./reviews.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import { addReviewSchema, deleteReviewSchema, editReviewSchema, getReviewsSchema } from "./reviews.validation.js";
import verifyJwtToken from "../../middleware/jwtVerification.middleware.js";

const reviewRoot = express.Router();

reviewRoot
    .post("/v1/", verifyJwtToken, schemaValidator(addReviewSchema) ,reviewController.addReview)
    .get("/:id/v1/", schemaValidator(getReviewsSchema), reviewController.getReviews)
    .patch("/:id/v1/", verifyJwtToken, schemaValidator(editReviewSchema), reviewController.editReview)
    .delete("/:id/v1/", verifyJwtToken, schemaValidator(deleteReviewSchema), reviewController.deleteReview)

export default reviewRoot;