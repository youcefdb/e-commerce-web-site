import asyncHandler from "../../utils/tryCatch.util.js";
import * as productServers from "./product.services.js";

//Get products with filtring 
const getProducts = asyncHandler(async(req, res) => {
        const query = req.validatedQuery;
        var filter = {};

        if (query.search != undefined) {
            filter.search = query.search;
        }

        if (query.minPrice != undefined) {
            filter.minPrice = query.minPrice
        }

        if (query.maxPrice != undefined) {
            filter.maxPrice = query.maxPrice
        }

        if (query.category != undefined) {
            filter.category = query.category
        }

        if (query.sort === "price") {
            filter.sort = 'price';
        }else if(query.sort === "newest"){
            filter.sort = 'newest';
        }else if (query.sort === "rating") {
            filter.sort = 'rating';
        }
        
        if (query.order == "desc") {
            filter.order = "desc"
        }else if(query.order == "asc"){
            filter.order = "asc"
        }

        const result = await productServers.getProducts(filter, query.page, query.limit);
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
