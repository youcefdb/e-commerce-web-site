import * as categoriesServices from "./categories.services.js";

//Get all categories
const getCategories = async (req, res) => {
    try {
        const result = await categoriesServices.getCategories();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        }); 
    }
}

export {
    getCategories
}