const schemaValidator = (schema) => {
    return (req, res, next) => {
        const query = req.body || req.query || req.params;
        const {error} = schema.validate(query);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        next();
    }
}


const paramsSchemaValidator = (schema) => {
    return (req, res, next) => {
        const query = req.params;
        const {error} = schema.validate(query);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        next();
    }
}
export {paramsSchemaValidator}
export default schemaValidator;