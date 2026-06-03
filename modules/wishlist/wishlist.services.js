import { AppError, throwIfNotFound } from "../../errors/errors.js";
import { buildResponce, getPagination } from "../../utils/responce.util.js";
import withTransaction from "../../utils/transaction.util.js";
import { viewProduct } from "../products/product.repo.js";
import * as wishListRepo from "./wishlist.repo.js";

//Get white list content
const getWishlist = async(userId, page, limit) => {
    const {safePage, safeLimit, offset} = getPagination(page, limit);
    
    const result = await wishListRepo.getWhishlist(userId, safeLimit, offset);
    throwIfNotFound(result, "Your wishlist is empty");

    return buildResponce(result, safePage, offset);
}

//add item to white list
const addTowishlist = async(data, userId) => {
    return withTransaction(async(client) => {
        const product = await viewProduct(data.productId);
        throwIfNotFound(product, "Product not found");
        
        var wishlist = await wishListRepo.findWhishlist(userId, {db: client});
        if (!wishlist) {
            wishlist = await wishListRepo.initializeWhishlist(userId, {db: client});
        }

        try {
            const newData = {wishListId: wishlist.id, productId: data.productId};
            var result = await wishListRepo.addToWishlist(newData, {db: client});
        } catch (error) {
            if (error.code = "23505") {
                throw AppError("Product already exist", 409);
            }
            throw error;
        }
        return {
            data: result, 
            count: result.length
        }
    });
}

//delete product from white list
const deleteFromWhishList = async(id, userId) => {
    return withTransaction(async(client) => {        
        const newData = {userId, id};
        const result = await wishListRepo.deleteFromWhishList(newData, {db: client});
        throwIfNotFound(result, "Product not found");
        
        return {
            message: "Product deleted successfully",
            data: result
        }
    });
}

export{
    getPagination,
    addTowishlist,
    deleteFromWhishList,
    getWishlist
}