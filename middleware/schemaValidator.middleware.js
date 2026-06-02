const schemaValidator = (schema) => {
    return (req, res, next) => {
        const data = {
        ...req.body,
        ...req.params,
        ...req.query
    };

    const { error, value } = schema.validate(data, {
        abortEarly: false
    });

    if (error) {
        return res.status(400).json({
            message: "Validation error",
            errors: error.details.map(err => err.message)
        });
    }

        req.validatedData = value;

        next();
    }
}


export default schemaValidator;