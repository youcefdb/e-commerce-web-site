import { randomUUID } from "crypto";
import withTransaction from "../../utils/transaction.util.js";
import { AppError, throwIfNotFound } from "../../errors/errors.js";
import * as categoriesRepo from "../categories/categories.repo.js";
import * as productRepo from "./product.repo.js";
import {buildResponce, getPagination} from "../../utils/responce.util.js";

const makeProductSlug = (name) => {
    const base = name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 210) || "product";

    return `${base}-${randomUUID()}`;
}

const findCategory = async (slug, client) => {
    const category = await categoriesRepo.getCategoryBySlug(slug, {db: client});
    throwIfNotFound(category, "Category not found");
    return category;
}

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
    return buildResponce(result.data, safePage, offset, result.totalCount);
}

const createProduct = async (data) => {
    return withTransaction(async (client) => {
        const category = await findCategory(data.category, client);
        const created = await productRepo.createProduct({
            categoryId: category.id,
            name: data.name,
            slug: makeProductSlug(data.name),
            description: data.description ?? null,
            price: data.price,
            stock: data.stock,
            image: data.image || null
        }, {db: client});
        throwIfNotFound(created, "Product could not be created");

        const product = await productRepo.getProductForManagement(created.id, {db: client});
        throwIfNotFound(product, "Product could not be loaded");
        return product;
    });
}

const updateProduct = async (productId, data) => {
    return withTransaction(async (client) => {
        const existing = await productRepo.getProductForManagement(productId, {db: client});
        throwIfNotFound(existing, "Product not found");

        const updates = {...data};
        delete updates.category;
        if (data.category !== undefined) {
            const category = await findCategory(data.category, client);
            updates.categoryId = category.id;
        }
        if (data.name !== undefined) {
            updates.slug = makeProductSlug(data.name);
        }

        await productRepo.updateProductDetails(productId, updates, {db: client});
        const product = await productRepo.getProductForManagement(productId, {db: client});
        throwIfNotFound(product, "Product not found");
        return product;
    });
}

const deleteProduct = async (productId) => {
    try {
        const deleted = await productRepo.deleteProduct(productId);
        throwIfNotFound(deleted, "Product not found");
        return {success: true, message: "Product deleted successfully"};
    } catch (error) {
        if (error?.code === "23503") {
            throw AppError("Product cannot be deleted because it is referenced by an existing order.", 409);
        }
        throw error;
    }
}


export{
    viewProduct,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
}
