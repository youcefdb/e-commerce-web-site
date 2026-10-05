import asyncHandler from "../../middleware/tryCatch.middleware.js";
import * as categoriesServices from "./categories.services.js";

//Get all categories
const getCategories = asyncHandler(async(req, res) => {
    const result = await categoriesServices.getCategories();
    return res.status(200).json(result);
});

export {
    getCategories
}