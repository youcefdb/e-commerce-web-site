import Joi from "joi";

//Sign in validation schema
const registerValidationSchema = Joi.object({
    email: Joi.string().email().required().messages({
            "string.email": "Please enter a valid email",
            "any.required": "Email is required"
        }),
    password: Joi.string().trim().min(8).required().messages({
            "string.min": "Password must be at least 8 characters",
            "any.required": "Password is required"
        }),
    name: Joi.string().trim().min(2).required().messages({
            "string.min": "Name must be at least 2 characters",
            "any.required": "Name is required"
        })
}).unknown(false);


//Log in validation schema
const loginValidationSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email",
        "any.required": "Email is required"
    }),

    password: Joi.string().trim().min(8).required().messages({
        "string.min": "Password must be at least 8 characters",
        "any.required": "Password is required"
    }),
}).unknown(false);

const resendVerificationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().trim().min(8).required()
}).unknown(false);

const verifyEmailQuerySchema = Joi.object({
    token: Joi.string().pattern(/^[A-Za-z0-9_-]{40,100}$/).required(),
    confirm: Joi.string().valid("1").optional()
}).unknown(false);


export{
    registerValidationSchema,
    loginValidationSchema,
    resendVerificationSchema,
    verifyEmailQuerySchema
}
