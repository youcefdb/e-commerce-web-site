import conn from "../../config/db.config.js";

//Create user (role/castomer)
const createUser = async (data, ctx) => {
    const query = `
        INSERT INTO users(name, email, password, provider)
        VALUES($1, $2, $3, $4)
        RETURNING *
    `;
    const {rows} = await ctx.db.query(query, [
        data.name,
        data.email,
        data.password,
        data.provider
    ]);

    return rows[0];
};

//store refresh token
const storeRefreshToken = async(data, ctx) => {
    const query = `
        INSERT INTO refresh_tokens(user_id, token, expires_at, device, ip_address)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *
    `;

    const {rows} = await ctx.db.query(query, [
            data.userId,
            data.token,
            data.expiresAt,
            data.device,
            data.ip_address
        ]
    );
    return rows[0]
}

//find user by email
const findUserByEmail = async (email, ctx) => {
    const query = `
        SELECT id, name, email, password, avatar, created_at, updated_at
        FROM users
        WHERE email = $1
    `;

    const {rows} = await ctx.db.query(query, [email]);
    return rows[0];
}

//find user by id
const findUserById = async(id, ctx = {db: conn}) => {
    const query = `
        SELECT id, name, email, password, avatar, created_at, updated_at
        FROM users
        WHERE id = $1
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

//find user by id
const findRefreshToken = async (token, ctx) => {
    const query = `
        SELECT id, token, expires_at, created_at
        FROM refresh_tokens
        WHERE token = $1
    `;

    const {rows} = await ctx.db.query(query, [token]);
    return rows[0];
}

const deleteRefreshToken = async(token, ctx) =>{
    const query = `
        DELETE FROM refresh_tokens
        WHERE token = $1
        RETURNING *
    `;

    const {rows} = await ctx.db.query(query, [token]);
    return rows[0];
}

//Delete all refresh token for spesific user
const logoutAllSession = async(userId, ctx) => {
    const query = `
        DELETE FROM refresh_tokens
        WHERE user_id = $1
    `;

    const {rows} = await ctx.db.query(query, [userId]);
    return rows[0];
}


export{
    createUser,
    storeRefreshToken,
    findUserByEmail,
    findUserById,
    findRefreshToken,
    deleteRefreshToken,
    logoutAllSession
}