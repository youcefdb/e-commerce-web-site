import conn from "../../config/db.config.js";
import {
    DEFAULT_ORDERS_PAGE_SIZE,
    MAX_ORDERS_OFFSET,
    MAX_ORDERS_PAGE_SIZE
} from "./orders.pagination.js";

//Get user orders
const getOrders = async(userId, limit = DEFAULT_ORDERS_PAGE_SIZE, offset = 0, ctx = {db:conn}) => {
    const boundedLimit = Number.isSafeInteger(limit)
        ? Math.min(Math.max(limit, 1), MAX_ORDERS_PAGE_SIZE)
        : DEFAULT_ORDERS_PAGE_SIZE;
    const boundedOffset = Number.isSafeInteger(offset)
        ? Math.min(Math.max(offset, 0), MAX_ORDERS_OFFSET)
        : 0;

    const query = `
        SELECT id, total_price, status, created_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2 OFFSET $3
    `;

    const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM orders
        WHERE user_id = $1
    `;

    const [{rows}, {rows: countRows}] = await Promise.all([
        ctx.db.query(query, [userId, boundedLimit, boundedOffset]),
        ctx.db.query(countQuery, [userId])
    ]);
    return {data: rows, totalCount: Number(countRows[0].total_count)};
}

//Get orders items and details
const getOrderDetails = async(data, ctx = {db:conn}) => {
    const query = `
        WITH products_details AS (
            SELECT id, name
            FROM products
        ),

        user_orders AS (
            SELECT id, user_id, status, total_price, shipping_address, payment_method, paid_at
            FROM orders
            WHERE user_id = $1
        ),

        items_order AS (
            SELECT id, product_id, order_id, price, quantity, (price * quantity) AS item_price
            FROM order_items oi
            WHERE order_id = $2
        )

        SELECT io.price, io.quantity, io.item_price, pd.name, ur.status, ur.total_price 
        FROM products_details pd
        JOIN items_order io ON io.product_id = pd.id
        JOIN user_orders ur ON ur.id = io.order_id
    `;

    const {rows} = await ctx.db.query(query, [data.userId, data.orderId]);
    return rows;
}

// Lock a customer's order before evaluating a cancellation transition.
const findUserOrderForUpdate = async(data, ctx) => {
    const query = `
        SELECT id, status
        FROM orders
        WHERE id = $1 AND user_id = $2
        FOR UPDATE
    `;

    const {rows} = await ctx.db.query(query, [data.orderId, data.userId]);
    return rows[0];
}

// Read persisted order quantities, grouped and ordered to match checkout's
// product-row lock order.
const getOrderInventory = async(orderId, ctx) => {
    const query = `
        SELECT product_id, SUM(quantity)::integer AS quantity
        FROM order_items
        WHERE order_id = $1
        GROUP BY product_id
        ORDER BY product_id
    `;

    const {rows} = await ctx.db.query(query, [orderId]);
    return rows;
}

const updateUserOrderStatus = async(data, ctx) => {
    const query = `
        UPDATE orders
        SET status = $1
        WHERE id = $2 AND user_id = $3 AND status = $4
        RETURNING id, status
    `;

    const {rows} = await ctx.db.query(query, [
        data.status,
        data.orderId,
        data.userId,
        data.currentStatus
    ]);
    return rows[0];
}

//create order
const placeOrder = async (data, ctx) => {
    const query = `
        INSERT INTO orders (
            user_id,
            total_price,
            status,
            shipping_address,
            payment_method,
            paid_at,
            delivered_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;

    const { rows } = await ctx.db.query(query, [
        data.userId,
        data.totalPrice,
        data.status,
        JSON.stringify(data.shippingAddress),
        data.paymentMethod,
        data.paidAt,
        data.deliveredAt
    ]);

    return rows[0];
};

//Add items to order
const addOrderItems = async (values, placeholders, ctx) => {
    const query = `
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price
        )
        VALUES ${placeholders}
        RETURNING *
    `;

    const { rows } = await ctx.db.query(query, values);

    return rows;
};

export{
    getOrders,
    getOrderDetails,
    findUserOrderForUpdate,
    getOrderInventory,
    updateUserOrderStatus,
    placeOrder,
    addOrderItems
};
