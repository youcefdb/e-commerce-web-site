import express from "express";
import * as reviewController from "./reviews.controller.js";
import schemaValidator, { paramsSchemaValidator } from "../../middleware/schemaValidator.middleware.js";
import { addReviewSchema, getReviewsSchema } from "./reviews.validation.js";

const reviewRoot = express.Router();

reviewRoot
    .post("/", schemaValidator(addReviewSchema) ,reviewController.addReview)
    .get("/:id", paramsSchemaValidator(getReviewsSchema), reviewController.getReviews)

export default reviewRoot;