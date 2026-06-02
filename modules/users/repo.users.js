import conn from "../../config/db.config.js";

//Update user infos
const updateUser = async (params, values, id, ctx) => {
    const query = `
        UPDATE users
        SET ${params.join(',')}
        WHERE id = $1
        RETURNING name, email, updated_at
    `;

    const {rows} = await ctx.db.query(query, [id, ...values]);
    return rows[0];
}

export {
    updateUser
}