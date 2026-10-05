import asyncHandler from "../../utils/tryCatch.util.js";
import * as wishListServices from "./wishlist.services.js";

//get white list content
const getWhishlist = asyncHandler(async(req, res) =>{
    const result = await wishListServices.getWishlist(req.user.id, req.query.page, req.query.limit);
    return res.status(200).json(result);
})

//Add product to white list
const addTowishlist = asyncHandler(async(req, res) => {
    const result = await wishListServices.addTowishlist(req.body, req.user.id);
    return res.status(201).json(result);
});

//delete product from white list
const deleteFromWhishList = asyncHandler(async(req, res) => {
    const result = await wishListServices.deleteFromWhishList(req.params.id, req.user.id);
    return res.status(200).json(result);
});

export{
    getWhishlist,
    addTowishlist,
    deleteFromWhishList
}