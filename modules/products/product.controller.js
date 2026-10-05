import asyncHandler from "../../utils/tryCatch.util.js";
import * as productServers from "./product.services.js";

//Get products with filtring 
const getProducts = asyncHandler(async(req, res) => {
        var filter = {};

        if (req.query.search != undefined) {
            filter.search = req.query.search;
        }

        if (req.query.minPrice != undefined) {
            filter.minPrice = req.query.minPrice
        }

        if (req.query.maxPrice != undefined) {
            filter.maxPrice = req.query.maxPrice
        }

        if (req.query.category != undefined) {
            filter.category = req.query.category
        }

        if (req.query.sort === "price") {
            filter.sort = 'price';
        }else if(req.query.sort === "newest"){
            filter.sort = 'newest';
        }else if (req.query.sort === "rating") {
            filter.sort = 'rating';
        }
        
        if (req.query.order == "desc") {
            filter.order = "desc"
        }else if(req.query.order == "asc"){
            filter.order = "asc"
        }

        const result = await productServers.getProducts(filter, req.query.page, req.query.limit);
        return res.status(200).json(result);
})

//Get product details
const viewProduct = asyncHandler(async (req, res) => {
    const result = await productServers.viewProduct(req.params.id);
    return res.status(200).json(result);
})

export{
    getProducts,
    viewProduct
}