import conn from "../../config/db.config.js";

//Get user orders
const getOrders = async(userId, ctx = {db:conn}) => {
    const query = `
        SELECT id, total_price, status, created_at
        FROM orders
        WHERE user_id = $1
    `;

    const {rows} = await ctx.db.query(query, [userId]);
    return rows;
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
    placeOrder,
    addOrderItems
};