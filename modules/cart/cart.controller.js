import asyncHandler from "../../utils/tryCatch.util.js";
import * as cartServices from "./cart.services.js";

//add product to cart
const addProductToCart = asyncHandler(async(req, res) => {
    const result = await cartServices.addProductToCart(req.body, req.user.id);
    return res.status(200).json(result);
})

//get cart content
const getCartContent = asyncHandler(async(req, res) => {
    const result = await cartServices.getCartContent(req.user.id);
    return res.status(200).json(result);
})

//Remove product from cart
const removeProductFromCart = asyncHandler(async(req, res) => {
    const result = await cartServices.removeProductFromCart(req.params.id, req.user.id);
    return res.status(200).json(result);
})

//increment or decrement product quantity
const editProductQuantity = asyncHandler(async(req, res) =>{
    const result = await cartServices.editProductQuantity({id: req.params.id, quantity: req.body.quantity}, req.user.id);
    return res.status(200).json(result);
})

export {
    addProductToCart,
    getCartContent,
    removeProductFromCart,
    editProductQuantity
}