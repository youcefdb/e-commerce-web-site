import conn from "../../config/db.config.js";

//Create user (role/castomer)
const createUser = async (data, ctx) => {
    const query = `
        INSERT INTO users(name, email, password, provider)
        VALUES($1, $2, $3, $4)
        RETURNING id, name, role, email, created_at, updated_at
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
        SELECT id, name, email, password, role, provider, avatar, created_at, updated_at
        FROM users
        WHERE email = $1
    `;

    const {rows} = await ctx.db.query(query, [email]);
    return rows[0];
}

//find user by id
const findUserById = async(id, ctx = {db: conn}) => {
    const query = `
        SELECT id, name, email, password, role, provider, avatar, created_at, updated_at
        FROM users
        WHERE id = $1
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

// Hold a shared user-row lock while a refresh token is being rotated. A password
// update conflicts with this lock, so it can revoke tokens created by an
// in-flight refresh before its transaction commits.
const findUserByIdForShare = async(id, ctx = {db: conn}) => {
    const query = `
        SELECT id, name, email, password, role, provider, avatar, created_at, updated_at
        FROM users
        WHERE id = $1
        FOR SHARE
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

//find user by id
const findRefreshToken = async (data, ctx = {db: conn}) => {
    const query = `
        SELECT id, token, expires_at, created_at
        FROM refresh_tokens
        WHERE token = $1 AND user_id = $2
        FOR UPDATE NOWAIT
    `;

    const {rows} = await ctx.db.query(query, [data.token, data.userId]);
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
const logoutAllSession = async(userId, ctx = {db: conn}) => {
    const query = `
        DELETE FROM refresh_tokens
        WHERE user_id = $1
    `;

    const {rows} = await ctx.db.query(query, [userId]);
    return rows[0];
}

//Add Idempotency Key
const addIdempotencyKey = async (data, ctx = {db: conn}) => {
    const query = `
        INSERT INSTO idempotency_keys(user_id, idempotency_key, request_hash)
        VALUES($1, $2, $3)
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [data.userId, data.idKey, hashRequest]);
    return rows[0];
}

//Get Idempotency Key
const getIdempotencyKey = async (data, ctx = {db: conn}) => {
    const query = `
        SELECT idempotency_key, request_hash, status, response_status, response_body
        FROM idempotency_keys
        WHERE user_id = $1 AND idempotency_key = $2
    `;

    const {rows} = await ctx.db.query(query, [data.userId, data.idKey]);
    return rows[0];
}


export{
    createUser,
    storeRefreshToken,
    findUserByEmail,
    findUserById,
    findUserByIdForShare,
    findRefreshToken,
    deleteRefreshToken,
    logoutAllSession,
    addIdempotencyKey,
    getIdempotencyKey
}
