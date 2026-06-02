import conn from "../../config/db.config.js";

//Get all categories
const getCategories = async (ctx = {db: conn}) => {
    const query = `
        SELECT name, created_at
        FROM categories
    `;

    const {rows} = await ctx.db.query(query);
    return rows;
}

export{
    getCategories
}