import conn from "../../config/db.config.js";

//Get product reviews
const getReviews = async (data, ctx = {db: conn}) => {
    const query = `
        WITH userInfo AS (
            SELECT id, name, avatar 
            FROM users
        )

        SELECT u.*, r.comment, r.rating
        FROM reviews r
        JOIN userInfo u ON u.id = r.user_id
        WHERE product_id = $1
        ORDER BY r.created_at, r.id
        LIMIT $2 OFFSET $3
    `;

    const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM reviews
        WHERE product_id = $1
    `;

    const [{rows}, {rows: countRows}] = await Promise.all([
        ctx.db.query(query, [data.productId, data.limit, data.offset]),
        ctx.db.query(countQuery, [data.productId])
    ]);
    return {data: rows, totalCount: Number(countRows[0].total_count)};
}

//Add review to product
const addReview = async (data, ctx) => {
    const query = `
        INSERT INTO reviews(user_id, product_id, rating, comment)
        VALUES($1, $2, $3, $4)
        RETURNING id, rating, comment;
    `;

    const {rows} = await ctx.db.query(query, [data.userId, data.productId, data.rating, data.comment]);
    return rows[0];
}

//Delete user review
const deleteReview = async (data, ctx) => {
    const query = `
        DELETE FROM reviews
        WHERE id = $1
        AND user_id = $2
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [data.id, data.userId]);
    return rows[0];
}

//edit posted review
const editReview = async(values, params, ctx) => {
    const idIndex = values.length - 1;
    const userIdIndex = values.length;
    const query = `
        UPDATE reviews
        SET ${params.join(",")}
        WHERE id = $${idIndex}
        AND user_id = $${userIdIndex}
        RETURNING rating, comment, created_at;
    `;

    const {rows} = await ctx.db.query(query, values);
    return rows[0];
}

//Read the review's product before locking the product row.
const getReview = async (data, ctx = {db: conn}) => {
    const query = `
        SELECT id, product_id, comment, rating
        FROM reviews
        WHERE id = $1
        AND user_id = $2
    `;

    const {rows} = await ctx.db.query(query, [data.reviewId, data.userId]);
    return rows[0];
}

//Lock the review after its product row has been locked by the service.
const findReview = async (data, ctx = {db: conn}) => {
    const query = `
        SELECT id, product_id, comment, rating
        FROM reviews
        WHERE id = $1
        AND user_id = $2
        FOR UPDATE
    `;

    const {rows} = await ctx.db.query(query, [data.reviewId, data.userId]);
    return rows[0];
}

export{
    getReviews,
    addReview,
    deleteReview,
    editReview,
    getReview,
    findReview
}
