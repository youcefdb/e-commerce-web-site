import { throwIfNotFound } from "../../errors/errors.js";
import * as productRepo from "./product.repo.js";
import {buildResponce, getPagination} from "../../utils/responce.util.js";

//Get one product details
const viewProduct = async(productId) => {
    const product = await productRepo.viewProduct(productId);
    throwIfNotFound(product, "Product not found");

    return {
        data: product
    }
}

//Get all products by filtring
const getProducts = async (filter, page, limit) => {
    const {safePage, safeLimit, offset} = getPagination(page, limit);
    const result = await productRepo.getProducts(filter, safeLimit, offset);
    return buildResponce(result, safePage, offset);
}


export{
    viewProduct,
    getProducts
}