import Joi from "joi";

//Schema for update user profile
const updateUserSchema = Joi.object({
    email: Joi.string().email().optional(),
    name: Joi.string().trim().min(2).optional(),
    password: Joi.string().trim().min(8).optional()
}).unknown(false);


export{
    updateUserSchema
}