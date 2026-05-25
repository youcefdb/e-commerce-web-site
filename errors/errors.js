//Custome error
const AppError = (msg, statusCode = 500) => {
    const error = new Error(msg);
    error.statusCode = statusCode
    return error;
}

//Throw if not found
const throwIfNotFound = (data, msg = "Resource not found") => {
    if(!data){
        throw AppError(msg, 404);
    }
    return data;
}

export {
    AppError,
    throwIfNotFound
}