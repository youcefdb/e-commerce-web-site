import Joi from "joi";
import {
  DEFAULT_ORDERS_PAGE_SIZE,
  MAX_ORDERS_PAGE,
  MAX_ORDERS_PAGE_SIZE
} from "./orders.pagination.js";

const getOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(MAX_ORDERS_PAGE).default(1),
  limit: Joi.number().integer().min(1).max(MAX_ORDERS_PAGE_SIZE).default(DEFAULT_ORDERS_PAGE_SIZE)
}).unknown(false);

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
    postal_code: Joi.string().trim().min(1).max(32)
  }).required(),

  paymentMethod: Joi.string().trim().required(),
  paidAt: Joi.date().allow(null),

  product,

  products: Joi.object({
    items: Joi.array().items(product).unique("productId").min(1).required()
  })

}).xor("product", "products").unknown(false);


const orderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const updateOrderStatusParamsSchema = Joi.object({
  id: Joi.string().trim().uuid().required()
}).unknown(false);

const updateOrderStatusBodySchema = Joi.object({
  status: Joi.string().trim().lowercase().valid(...orderStatuses).required()
}).unknown(false);

export {
    getOrdersQuerySchema,
    orderStatuses,
    getOrderDetailsSchema,
    placeOrderSchema,
    updateOrderStatusParamsSchema,
    updateOrderStatusBodySchema
}
