import conn from "../../config/db.config.js";

//get user white list
const getWhishlist = async(userId, limit, offset, ctx = {db:conn}) => {
    const query = `
        WITH user_products AS (
            SELECT id, name, description, price, rating, num_reviews
            FROM products 
        ),

        white_products AS (
            SELECT id, user_id
            FROM wishlists
            WHERE user_id = $1 
        )

        SELECT up.name, up.description, up.price, up.rating, up.num_reviews
        FROM user_products up
        JOIN wishlist_items wi ON wi.product_id = up.id
        JOIN white_products wp ON wp.id = wi.wishlist_id
        LIMIT $2 OFFSET $3
    `;

    const {rows} = await ctx.db.query(query, [userId, limit, offset]);
    return rows;
}

//Create white list
const initializeWhishlist = async(userId, ctx) => {
    const query = `
        INSERT INTO wishlists(user_id)
        VALUES($1)
        RETURNING *
    `;

    const {rows} = await ctx.db.query(query, [userId]);
    return rows[0];
}

//Add product to white list
const addToWishlist = async(data, ctx) => {
    const query = `
        INSERT INTO wishlist_items(wishlist_id, product_id)
        VALUES($1, $2)
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [data.wishListId, data.productId]);
    return rows[0];
}

//find white list by user id
const findWhishlist = async(userId, ctx= {db: conn}) => {
    const query = `
        SELECT id, created_at FROM wishlists
        WHERE user_id = $1
    `;

    const {rows} = await ctx.db.query(query, [userId]);
    return rows[0];
}

//delete product form white list
const deleteFromWhishList = async(data, ctx) => {
    const query = `
        DELETE FROM wishlist_items wi
        USING wishlists w
        WHERE w.id = wi.wishlist_id
        AND wi.id = $1 AND w.user_id = $2
        RETURNING wi.id;
    `;

    const {rows} = await ctx.db.query(query, [data.id, data.userId]);
    return rows[0];
}

export{
    getWhishlist,
    initializeWhishlist,
    addToWishlist,
    findWhishlist,
    deleteFromWhishList
}