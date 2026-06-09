import conn from "../../config/db.config.js";

//Get product details
const viewProduct = async (id, ctx = {db: conn}) => {
    const query = `
        SELECT id, name, description, image, price, stock, rating, num_reviews
        FROM products
        WHERE id = $1
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

//Get products by filtring
const getProducts = async (filter, limit, offset, ctx = {db: conn}) => {
    let query = `
        SELECT p.name, p.description, p.price, p.rating, p.num_reviews
        FROM products p
    `;

    let index = 1;
    let values = [];

    let hasWhere = false;

    if (filter.category != undefined) {
        query += `
            WHERE p.category_id = $${index++}
        `;

        values.push(filter.category);
        hasWhere = true;
    }

    if (filter.search !== undefined) {
        query += ` ${hasWhere ? " AND" : "WHERE"} p.name ILIKE $${index++}`;
        values.push(`%${filter.search}%`);
        hasWhere = true;
    }

    if (filter.minPrice !== undefined) {
        query += ` ${hasWhere ? " AND" : "WHERE"} p.price >= $${index++}`;
        values.push(filter.minPrice);
        hasWhere = true;
    }

    if (filter.maxPrice !== undefined) {
        query += ` ${hasWhere ? " AND" : "WHERE"} p.price <= $${index++}`;
        values.push(filter.maxPrice);
        hasWhere = true;
    }


    if (filter.sort) {
        query += ` ORDER BY `;

        switch (filter.sort) {
            case "price":
                query += "p.price";
                break;
            case "newest":
                query += "p.created_at";
                break;
            case "rating":
                query += "p.rating";
                break;
        }

        query += filter.order === "desc" ? " DESC" : " ASC";
    }else{
        query += ` ORDER BY p.created_at DESC `;
    }

    query += `
        LIMIT $${index++} OFFSET $${index++}
    `;

    values.push(limit, offset);
    const {rows} = await ctx.db.query(query, values);
    return rows;
}

//Increment or decreament product quantity
const productStock = async (data, ctx) => {
    const query = `
        UPDATE products
        SET stock = $1 
        WHERE id = $2
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [data.stock, data.id]);
    return rows[0];
}


export {
    viewProduct,
    getProducts,
    productStock
}