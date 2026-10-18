import Joi from "joi";

//Get user order details schema
const getOrderDetailsSchema = Joi.object({
    id: Joi.string().trim().uuid().required()
}).unknown(false);

const product = Joi.object({
    productId: Joi.string().trim().uuid().required(),
    quantity: Joi.number().integer().positive().max(10).required()
});

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

  product,

  products: Joi.object({
    items: Joi.array().items(product).unique("productId").min(1).required()
  })

}).xor("product", "products").unknown(false);


const statuses = ['pending', 'delivered', 'cancelled'];
const updateOrderStatusParamsSchema = Joi.object({
  id: Joi.string().trim().uuid().required()
}).unknown(false);

const updateOrderStatusBodySchema = Joi.object({
  status: Joi.string().trim().lowercase().valid(...statuses).required()
}).unknown(false);

export {
    getOrderDetailsSchema,
    placeOrderSchema,
    updateOrderStatusParamsSchema,
    updateOrderStatusBodySchema
}
