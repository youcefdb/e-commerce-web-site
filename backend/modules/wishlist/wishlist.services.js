import { AppError, throwIfNotFound } from "../../errors/errors.js";
import { buildResponce, getPagination } from "../../utils/responce.util.js";
import withTransaction from "../../utils/transaction.util.js";
import { viewProduct } from "../products/product.repo.js";
import * as wishListRepo from "./wishlist.repo.js";
import {
    DEFAULT_WISHLIST_PAGE_SIZE,
    MAX_WISHLIST_PAGE,
    MAX_WISHLIST_PAGE_SIZE
} from "./wishlist.pagination.js";

//Get white list content
const getWishlist = async(userId, page = 1, limit = DEFAULT_WISHLIST_PAGE_SIZE) => {
    if (!Number.isSafeInteger(page) || page < 1 || page > MAX_WISHLIST_PAGE) {
        throw AppError("Invalid page", 400);
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_WISHLIST_PAGE_SIZE) {
        throw AppError("Invalid limit", 400);
    }

    const {safePage, safeLimit, offset} = getPagination(page, limit);
    
    const result = await wishListRepo.getWhishlist(userId, safeLimit, offset);
    return buildResponce(result.data, safePage, offset, result.totalCount);
}

//add item to white list
const addTowishlist = async(data, userId) => {
    return withTransaction(async(client) => {
        const product = await viewProduct(data.productId);
        throwIfNotFound(product, "Product not found");
        
        var wishlist = await wishListRepo.findWhishlist(userId, {db: client});
        if (!wishlist) {
            wishlist = await wishListRepo.initializeWhishlist(userId, {db: client});
            if (!wishlist) {
                wishlist = await wishListRepo.findWhishlist(userId, {db: client});
            }
        }

        try {
            const newData = {wishListId: wishlist.id, productId: data.productId};
            var result = await wishListRepo.addToWishlist(newData, {db: client});
        } catch (error) {
            throw error;
        }
        const count = await wishListRepo.countWishlistItems(wishlist.id, {db: client});

        return {
            data: result, 
            count
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
