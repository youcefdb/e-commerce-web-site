import * as categoriesRepo from "./categories.repo.js";

//Get all categories
const getCategories = async () => {
    const result = await categoriesRepo.getCategories();
    return {
        data: result
    }
}

export{
    getCategories
}