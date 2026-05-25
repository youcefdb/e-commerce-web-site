import conn from "../../config/db.config.js";

//Update user infos
const updateUser = async (values, ctx) => {
    const query = `
        UPDATE users
        SET ${values}
        WHERE id = ${values.id}
        RETURNING *
    `;

    const {rows} = await ctx.db.query(query, values);
    return rows[0];
}

export {
    updateUser
}