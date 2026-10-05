const globalMiddelware = (error, req, res, next) => {
    console.log(error);

    return res.status(error.status).json(error.message);
}

export default globalMiddelware;