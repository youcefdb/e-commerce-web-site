import * as categoriesController from "./categories.controller.js";
import express from "express";

const categoriesRoot = express.Router();

categoriesRoot
    .get("/", categoriesController.getCategories);

export default categoriesRoot