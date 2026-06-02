const schemaValidator = (schema) => {
    return (req, res, next) => {
        const query = req.body || req.query
        const {error} = schema.validate(query);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        next();
    }
}

export default schemaValidator;