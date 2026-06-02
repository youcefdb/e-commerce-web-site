import * as cartServices from "./cart.services.js";

//add product to cart
const addProductToCart = async (req, res) => {
    try {
        const result = await cartServices.addProductToCart(req.body, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        });
    };
}

//get cart content
const getCartContent = async(req, res) => {
    try {
        const result = await cartServices.getCartContent(req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        });
    };
}

//Remove product from cart
const removeCartProducts = async(req, res) => {
    try {
        const result = await cartServices.removeCartProducts(req.body, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        });
    }
}

//increment or decrement product quantity
const editProductQuantity = async(req, res) => {
    try {
        const result = await cartServices.editProductQuantity(req.body, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
       res.status(error.statusCode || 500).json({
            message: error.message
        }); 
    }
}

export {
    addProductToCart,
    getCartContent,
    removeCartProducts,
    editProductQuantity
}