
//Get pagination with errors handling
const getPagination = (page = 1, limit = 10) => {
    
    //handle negative values
    const safePage = Math.max(parseInt(page) || 2, 1); 
    const safeLimit = Math.max(parseInt(limit) || 10, 1);

    const offset = (safePage - 1) * safeLimit

    return {
        page: safePage,
        limit: safeLimit,
        offset
    }
}

//Build unique responce stracture
const buildResponce = (data, page, offset) => {
    return{
        page,
        offset,
        count: data.length,
        data
    }
}

export{
    getPagination,
    buildResponce
}