import { editProductQuantity } from "../cart/cart.repo.js";
import * as wishListServices from "./wishlist.services.js";

//get white list content
const getWhishlist = async(req, res) => {
    try {
        const result = await wishListServices.getWishlist(req.user.id, req.query.page, req.query.limit);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Add product to white list
const addTowishlist = async(req, res) => {
    try {
        const result = await wishListServices.addTowishlist(req.body, req.user.id);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//delete product from white list
const deleteFromWhishList = async(req, res) => {
    try {
        const result = await wishListServices.deleteFromWhishList(req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

export{
    getWhishlist,
    addTowishlist,
    deleteFromWhishList
}