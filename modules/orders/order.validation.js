import Joi from "joi";

//Get user order details schema
const getOrderDetailsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

const placeOrderSchema = Joi.object({
  status: Joi.string().trim().lowercase().valid('pending', 'delivered', 'cancelled').required(),

  shipping_address: Joi.object({
    fullName: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    postal_code: Joi.number().min(3).max(6)
  }).required(),

  paymentMethod: Joi.string().trim().required(),
  paidAt: Joi.date().allow(null),
  products: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required()
}).unknown(false);

export {
    getOrderDetailsSchema,
    placeOrderSchema
}