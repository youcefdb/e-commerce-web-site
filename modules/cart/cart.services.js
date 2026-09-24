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

        var item;
        const existProduct = await cartRepo.findItemOnCart({productId: data.productId, userId}, {db: client});
        if (existProduct) {
            if (product.stock < (data.quantity + existProduct.quantity)) {
                throw AppError("Requested quantity exceeds available stock", 400);
            }

            item = await cartRepo.editProductQuantity({userId, quantity: existProduct.quantity + data.quantity, id: product.id}, {db: client});
        } else{
            if (product.stock < data.quantity) {
                throw AppError("Product is out of stock", 400);
            }

            const newData = {
                cartId: cart.id,
                productId: data.productId,
                quantity: data.quantity
            }

            item = await cartRepo.addItemToCart(newData, {db: client});
        }

        
        return {
            message: "Item added successfully",
            data: item
        }
    });
}

//Get user cart content
const getCartContent = async(userId) => {
    //Find cart
    const cart = await cartRepo.findCartByUserId(userId);
    if (!cart) {
        return {
            items: [],
            itemsCount: 0,
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0
        };
    }

    //Get content
    const result = await cartRepo.getCartContent({userId});
    const subtotal = result.reduce(
        (sum, item) => sum + (parseFloat(item.price) * item.quantity), 0
    );
    const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15.00;
    const total = Number((subtotal + shipping).toFixed(2));
    const itemsCount = result.reduce((sum, item) => sum + item.quantity, 0);

    return {
        items: result,
        itemsCount,
        subtotal: Number(subtotal.toFixed(2)),
        tax: 0,
        shipping,
        total
    };
};

//Remove product from user cart
const removeProductFromCart = async (data, userId) => {
    return withTransaction(async(client) => {
        //Find cart
        const cart = await cartRepo.findCartByUserId(userId, {db: client});
        throwIfNotFound(cart, "Your cart is empty");

        //Remove product from cart
        const newData = { id: data, userId };
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
            const product = await viewProduct(data.id, {db: client});
            throwIfNotFound(product, "Product not found");
            
            if (product.stock < data.quantity) {
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