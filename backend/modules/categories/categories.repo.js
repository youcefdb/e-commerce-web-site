import conn from "../../config/db.config.js";

//Get all categories
const getCategories = async (ctx = {db: conn}) => {
    const query = `
        SELECT id, name, slug, description, image, created_at
        FROM categories
    `;

    const {rows} = await ctx.db.query(query);
    return rows;
}

const getCategoryBySlug = async (slug, ctx = {db: conn}) => {
    const query = `
        SELECT id, slug
        FROM categories
        WHERE slug = $1
    `;

    const {rows} = await ctx.db.query(query, [slug]);
    return rows[0];
}

export{
    getCategories,
    getCategoryBySlug
}
