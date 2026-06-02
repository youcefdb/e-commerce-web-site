import * as cartRepo from "./cart.repo.js";
import withTransaction from "../../utils/transaction.util.js";
import { AppError, throwIfNotFound } from "../../errors/errors.js";
import { viewProduct } from "../products/product.repo.js";

//Add item to cart
const addProductToCart = async (data, userId) => {
    return withTransaction(async(client) => {
        var cart = await cartRepo.findCartByUserId(userId, {db: client});
        if (!cart) {
            cart = await cartRepo.initializeCart(userId, new Date(), {db: client});
        }

        const product = await viewProduct(data.productId, {db: client});
        throwIfNotFound(product, "Product not found");

        if (product.stock < quantity) {
            throw AppError("Product is out of stock", 400);
        }

        const newData = {
            cartId: cart.id,
            productId: data.productId,
            quantity: data.quantity
        }

        const item = await cartRepo.addItemToCart(newData, {db: client});
        return {
            message: "Item added to cart",
            data: item
        }
    });
}

//Get user cart content
const getCartContent = async(userId) => {
    //Find cart
    const cart = await cartRepo.findCartByUserId(userId);
    throwIfNotFound(cart, "Your cart is empty");

    //Get content
    const result = await cartRepo.getCartContent({userId});
    const cart_total = result.reduce(
        (sum, item) => sum + parseFloat(item.item_total), 0
    );

    throwIfNotFound(result, "Your cart is empty");
    return {
        data: result,
        cart_total
    };
};

//Remove product from user cart
const removeProductFromCart = async (data, userId) => {
    return withTransaction(async(client) => {
        //Find cart
        const cart = await cartRepo.findCartByUserId(userId, {db: client});
        throwIfNotFound(cart, "Your cart is empty");

        //Remove product from cart
        const newData = {...data, userId};
        const result = await cartRepo.removeProductFromCart(newData, {db: client});
        throwIfNotFound(result, "Product not found");

        return {
            message: "Product deleted successfully",
            data: result
        }
    });
}

//Increment or reduce number of item 
const editProductQuantity = async (data, userId) => {
    return withTransaction(async(client) => {
        const cart = await cartRepo.findCartByUserId(userId, {db: client});
        throwIfNotFound(cart, "Your cart is empty");

        try {
            const product = await viewProduct(data.productId, {db: client});
            throwIfNotFound(product, "Product not found");
            
            if (product.stock < quantity) {
                throw AppError("Product is out of stock", 400);
            }
            
            const newData = {...data, userId}
            var result = await cartRepo.editProductQuantity(newData, {db: client});
            return {
                data: result
            };
        } catch (error) {
            if (error.code === "23514") {
                console.log("Product quantity can't be zero or less then")
                throw AppError("Product can't be null or negative", 422);
            }
            throw error;
        };
    });
}

export{
    addProductToCart,
    getCartContent,
    removeProductFromCart,
    editProductQuantity
}