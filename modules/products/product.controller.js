import * as productServers from "./product.services.js";

//Get products with filtring 
const getProducts = async (req, res) => {
    try {
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
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Get product details
const viewProduct = async(req, res) => {
    try {
        const result = await productServers.getProducts(req.params.productId);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        }); 
    }
}


export{
    getProducts,
    viewProduct
}