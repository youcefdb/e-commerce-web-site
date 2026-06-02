import express from "express";
import * as reviewController from "./reviews.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import { addReviewSchema, deleteReviewSchema, editReviewSchema, getReviewsSchema } from "./reviews.validation.js";

const reviewRoot = express.Router();

reviewRoot
    .post("/", schemaValidator(addReviewSchema) ,reviewController.addReview)
    .get("/:id", schemaValidator(getReviewsSchema), reviewController.getReviews)
    .patch("/:id", schemaValidator(editReviewSchema), reviewController.editReview)
    .delete("/:id", schemaValidator(deleteReviewSchema), reviewController.deleteReview)

export default reviewRoot;