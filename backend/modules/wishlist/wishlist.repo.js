import conn from "../../config/db.config.js";
import {
    DEFAULT_WISHLIST_PAGE_SIZE,
    MAX_WISHLIST_OFFSET,
    MAX_WISHLIST_PAGE_SIZE
} from "./wishlist.pagination.js";

//get user white list
const getWhishlist = async(userId, limit, offset, ctx = {db:conn}) => {
    const boundedLimit = Number.isSafeInteger(limit)
        ? Math.min(Math.max(limit, 1), MAX_WISHLIST_PAGE_SIZE)
        : DEFAULT_WISHLIST_PAGE_SIZE;
    const boundedOffset = Number.isSafeInteger(offset)
        ? Math.min(Math.max(offset, 0), MAX_WISHLIST_OFFSET)
        : 0;

    const query = `
        SELECT
            wi.id AS wishlist_item_id,
            p.id,
            p.category_id,
            c.slug AS category,
            p.name,
            COALESCE(p.description, '') AS description,
            p.price::float AS price,
            COALESCE(p.image, '') AS image,
            p.stock,
            p.rating::float AS rating,
            p.num_reviews,
            p.created_at
        FROM wishlists w
        JOIN wishlist_items wi ON wi.wishlist_id = w.id
        JOIN products p ON p.id = wi.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE w.user_id = $1
        ORDER BY wi.id
        LIMIT $2 OFFSET $3
    `;

    const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM wishlist_items wi
        JOIN wishlists w ON w.id = wi.wishlist_id
        WHERE w.user_id = $1
    `;

    const [{rows}, {rows: countRows}] = await Promise.all([
        ctx.db.query(query, [userId, boundedLimit, boundedOffset]),
        ctx.db.query(countQuery, [userId])
    ]);
    return {data: rows, totalCount: Number(countRows[0].total_count)};
}

//Create white list
const initializeWhishlist = async(userId, ctx) => {
    const query = `
        INSERT INTO wishlists(user_id)
        VALUES($1)
        ON CONFLICT (user_id) DO NOTHING
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

const countWishlistItems = async(wishlistId, ctx) => {
    const query = `
        SELECT COUNT(*) AS total_count
        FROM wishlist_items
        WHERE wishlist_id = $1
    `;

    const {rows} = await ctx.db.query(query, [wishlistId]);
    return Number(rows[0].total_count);
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
    countWishlistItems,
    findWhishlist,
    deleteFromWhishList
}
