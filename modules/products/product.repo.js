import conn from "../../config/db.config.js";

//Get product details
const viewProduct = async (id, ctx = {db: conn}) => {
    const query = `
        SELECT id, name, description, image, price, stock, rating, num_reviews, created_at
        FROM products
        WHERE id = $1
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

//Lock a product while review rows and their aggregate are being changed.
const lockProduct = async (id, ctx = {db: conn}) => {
    const query = `
        SELECT id
        FROM products
        WHERE id = $1
        FOR UPDATE
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

//Get products by filtring
const getProducts = async (filter, limit, offset, ctx = {db: conn}) => {
    const conditions = [];
    const values = [];

    if (filter.category != undefined) {
        conditions.push(`p.category_id = $${values.length + 1}`);
        values.push(filter.category);
    }

    if (filter.search !== undefined && filter.search.trim() !== "") {
        conditions.push(`to_tsvector(
            'english',
            coalesce(p.name, '') || ' ' || coalesce(p.description, '')
        ) @@ plainto_tsquery('english', $${values.length + 1})`);
        values.push(filter.search);
    }

    if (filter.minPrice !== undefined) {
        conditions.push(`p.price >= $${values.length + 1}`);
        values.push(filter.minPrice);
    }

    if (filter.maxPrice !== undefined) {
        conditions.push(`p.price <= $${values.length + 1}`);
        values.push(filter.maxPrice);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const dataValues = [...values, limit, offset];
    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;

    let query = `
        SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.stock, p.image, p.rating, p.num_reviews
        FROM products p
        ${whereClause}
    `;

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
        query += ", p.id ASC";
    }else{
        query += ` ORDER BY p.created_at DESC, p.id ASC `;
    }

    query += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

    const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM products p
        ${whereClause}
    `;

    const [{rows}, {rows: countRows}] = await Promise.all([
        ctx.db.query(query, dataValues),
        ctx.db.query(countQuery, values)
    ]);
    return {data: rows, totalCount: Number(countRows[0].total_count)};
}

//Increment or decreament product quantity
const productStock = async (data, ctx) => {
    const query = `
        UPDATE products
        SET stock = stock - $1 
        WHERE id = $2
            AND stock >= $1
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [data.stock, data.id]);
    return rows[0];
}

//Update product rating and review number
const updateProduct = async(id, ctx) =>{
    const query = `
        UPDATE products p
        SET rating = COALESCE((
                SELECT AVG(r.rating)
                FROM reviews r
                WHERE r.product_id = p.id
            ), 0),
            num_reviews = (
                SELECT COUNT(*)
                FROM reviews r
                WHERE r.product_id = p.id
            )
        WHERE p.id = $1
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}


export {
    viewProduct,
    lockProduct,
    getProducts,
    productStock,
    updateProduct
}
