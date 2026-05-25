import conn from "../../config/db.config.js";

//Create user (role/castomer)
const createUser = async (data, ctx) => {
    const query = `
        INSERT INTO users(name, email, password_hash, role, avatar)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const {rows} = await ctx.db.query(query, [
        data.name,
        data.email,
        data.password,
        data.role,
        data.avatar
    ]);

    return rows[0];
};

//store refresh token
const storeRefreshToken = async(data, ctx) => {
    const query = `
        INSERT INTO refresh_tokens(user_id, token, device, ip_address)
        VALUES($1, $2, $3, $4)
        RETURNING *
    `;

    const {rows} = await ctx.db.query(query, [
            data.userId,
            data.token,
            data.device,
            data.ip_address
        ]
    );
    return rows[0]
}

//find user by email
const findUserByEmail = async (id, ctx) => {
    const query = `
        SELECT id, name, email, password_hash, avatar, created_at, updated_at
        WHERE id = $1
    `;

    const {rows} = await ctx.db.query(query, id);
    return rows[0];
}

export{
    createUser,
    storeRefreshToken,
    findUserByEmail
}