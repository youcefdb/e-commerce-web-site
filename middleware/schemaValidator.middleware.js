import Joi from "joi";

const emptyObjectSchema = Joi.object().max(0);

const schemaValidator = (schemas) => {
    return (req, res, next) => {
        const validated = {};
        const errors = [];
        const sourceSchemas = {
            body: emptyObjectSchema,
            params: emptyObjectSchema,
            query: emptyObjectSchema,
            ...schemas
        };

        for (const [source, schema] of Object.entries(sourceSchemas)) {
            const {error, value} = schema.validate(req[source] ?? {}, {
                abortEarly: false
            });

            if (error) {
                errors.push(...error.details.map(err => err.message));
            } else {
                validated[source] = value;
            }
        }

        if (errors.length) {
            return res.status(400).json({
                message: "Validation error",
                errors
            });
        }

        if (validated.body !== undefined) {
            req.body = validated.body;
        }
        if (validated.params !== undefined) {
            req.params = validated.params;
        }
        if (validated.query !== undefined) {
            req.validatedQuery = validated.query;
        }

        next();
    }
}


export default schemaValidator;
