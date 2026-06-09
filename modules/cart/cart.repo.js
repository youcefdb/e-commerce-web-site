import conn from "../../config/db.config.js";

//Add item to the cart
const addItemToCart = async (data, ctx) => {
    const query = `
        INSERT INTO cart_items(cart_id, product_id, quantity)
        VALUES($1, $2, $3)
        RETURNING id, quantity
    `;

    const {rows} = await ctx.db.query(query, [data.cartId, data.productId, data.quantity]);
    return rows[0];
}

//initialize a cart to user
const initializeCart = async (userId, createdAt, ctx) => {
    const query = `
        INSERT INTO carts(user_id, created_at)
        VALUES($1, $2)
        RETURNING *
    `;

    const {rows} = await ctx.db.query(query, [userId, createdAt]);
    return rows[0];
}

//Find cart by user id
const findCartByUserId = async(id, ctx = {db: conn}) => {
    const query = `
        SELECT id, user_id, created_at
        FROM carts
        WHERE user_id = $1
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

//get content of of carts
const getCartContent = async(data, ctx = {db: conn}) => {
    const query = `
        WITH products_items AS (
            SELECT id, name, price, image
            FROM products
        ),

        user_cart AS (
            SELECT id, user_id
            FROM carts
            WHERE user_id = $1
        )

        SELECT
        pi.id AS product_id,
        pi.name,
        pi.price,
        pi.stock,
        pi.image,
        ci.quantity,
        (pi.price * ci.quantity) AS item_total
        FROM cart_items ci
        JOIN products_items pi ON pi.id = ci.product_id
        JOIN user_cart uc ON uc.id = ci.cart_id
    `;

    const {rows} = await ctx.db.query(query, [data.userId]);
    return rows;
}

//Remove product from cart
const removeProductFromCart = async (data, ctx = {db: conn}) => {
    var query = `
        WITH user_cart AS (
            SELECT id
            FROM carts
            WHERE user_id = $1
        )
        DELETE FROM cart_items ci
        USING user_cart uc
        WHERE uc.id = ci.cart_id
    `;

    var values = [data.userId];

    if (data.productId !== undefined) {
        query += `
            AND ci.product_id = $2
        `;
        values.push(data.productId);
    }

    query += ` RETURNING ci.id, ci.cart_id;`;

    const {rows} = await ctx.db.query(query, values);
    return rows[0];
}

//Add or reduce number of bought product
const editProductQuantity = async(data, ctx) => {
    const query = `
        WITH user_cart AS (
            SELECT id, user_id
            FROM carts
            WHERE user_id = $1
        )
        UPDATE cart_items ci
        SET quantity = $2
        FROM user_cart uc
        WHERE uc.id = ci.cart_id
        AND ci.product_id = $3
        RETURNING cart_id, product_id, quantity;
    `;

    const {rows} = await ctx.db.query(query, [data.userId, data.quantity, data.productId]);
    return rows[0];
}

export {
    addItemToCart,
    initializeCart,
    findCartByUserId,
    getCartContent,
    removeProductFromCart,
    editProductQuantity
}