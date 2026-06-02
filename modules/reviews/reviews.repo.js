import conn from "../../config/db.config.js";

//Get product reviews
const getReviews = async (productId, ctx = {db: conn}) => {
    const query = `
        WITH userInfo AS (
            SELECT id, name, avatar 
            FROM users
        )

        SELECT u.*, r.comment, r.rating
        FROM reviews r
        JOIN userInfo u ON u.id = r.user_id
        WHERE product_id = $1
    `;

    const {rows} = await ctx.db.query(query, [productId]);
    return rows;
}

//Add review to product
const addReview = async (data, ctx) => {
    const query = `
        INSERT INTO reviews(user_id, product_id, rating, comment)
        VALUES($1, $2, $3, $4)
        RETURNING rating, comment;
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
    const query = `
        UPDATE reviews
        SET ${params.join(",")}
        WHERE id = $${++params.length}
        AND user_id =$${++params.length}
        RETURNING rating, comment, created_at;
    `;

    const {rows} = await ctx.db.query(query, values);
    return rows[0];
}

//find review by id
const findReview = async (data, ctx = {db: conn}) => {
    const query = `
        SELECT id, comment, rating 
        FROM reviews
        WHERE id = $1
        AND user_id = $2
    `;

    const {rows} = await ctx.db.query(query, [data.reviewId, data.userId]);
    return rows[0];
}
export{
    getReviews,
    addReview,
    deleteReview,
    editReview,
    findReview
}