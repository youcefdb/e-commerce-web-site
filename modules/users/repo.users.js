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

//Update user photo
const updateProfilePic = async(data, ctx = {db: conn}) => {
    const query = `
        UPDATE users
        SET avatar = $2
        WHERE id = $1
        RETURNING id, avatar
    `;

    const {rows} = await ctx.db.query(query, [data.userId, data.photo]);
    return rows[0];
}
export {
    updateUser,
    updateProfilePic
}