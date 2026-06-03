import express from "express";
import * as reviewController from "./reviews.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import { addReviewSchema, deleteReviewSchema, editReviewSchema, getReviewsSchema } from "./reviews.validation.js";
import verifyJwtToken from "../../middleware/jwtVerification.middleware.js";

const reviewRoot = express.Router();

reviewRoot
    .post("/", verifyJwtToken, schemaValidator(addReviewSchema) ,reviewController.addReview)
    .get("/:id", schemaValidator(getReviewsSchema), reviewController.getReviews)
    .patch("/:id", verifyJwtToken, schemaValidator(editReviewSchema), reviewController.editReview)
    .delete("/:id", verifyJwtToken, schemaValidator(deleteReviewSchema), reviewController.deleteReview)

export default reviewRoot;