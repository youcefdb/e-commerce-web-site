
import { AppError } from "../errors/errors.js";

export const MAX_PAGE = 10_000;
export const MAX_PAGE_SIZE = 100;

//Get pagination with errors handling
const getPagination = (page = 1, limit = 10) => {
    if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) {
        throw AppError("Invalid page", 400);
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
        throw AppError("Invalid limit", 400);
    }

    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset) || offset > Number.MAX_SAFE_INTEGER) {
        throw AppError("Invalid pagination offset", 400);
    }

    return {
        safePage: page,
        safeLimit: limit,
        offset
    }
}

//Build unique responce stracture
const buildResponce = (data, page, offset, totalCount) => {
    return{
        page,
        offset,
        count: data.length,
        totalCount,
        data
    }
}

export{
    getPagination,
    buildResponce
}
