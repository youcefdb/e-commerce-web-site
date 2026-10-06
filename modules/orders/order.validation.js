import Joi from "joi";

//Get user order details schema
const getOrderDetailsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

const placeOrderSchema = Joi.object({
  shipping_address: Joi.object({
    fullName: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    postal_code: Joi.number().min(3).max(6)
  }).required(),

  paymentMethod: Joi.string().trim().required(),
  paidAt: Joi.date().allow(null),

  product: Joi.object({
    productId: Joi.uuid().trim().required(),
    quantity: Joi.number().integer().positive().max(10)
  }),

  products: Joi.object({
    items: Joi.array().items(product).unique("productId").required()
  })

}).unknown(false);


const statuses = ['pending', 'delivered', 'cancelled'];
const updateOrderStatusSchema = Joi.object({
  id: Joi.string().trim().uuid().required(),
  status: Joi.string().trim().lowercase().valid(...statuses).required()
});
export {
    getOrderDetailsSchema,
    placeOrderSchema,
    updateOrderStatusSchema
}