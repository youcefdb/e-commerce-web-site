import conn from "../../config/db.config.js";

//Create user (role/castomer)
const createUser = async (data, ctx) => {
    const query = `
        INSERT INTO users(name, email, password, provider, email_verified_at, google_id)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING id, name, role, email, provider, email_verified_at, google_id, avatar, created_at, updated_at
    `;
    const {rows} = await ctx.db.query(query, [
        data.name,
        data.email,
        data.password,
        data.provider ?? "local",
        data.emailVerifiedAt ?? null,
        data.googleId ?? null
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
        SELECT id, name, email, password, role, provider, email_verified_at, google_id, avatar, created_at, updated_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
    `;

    const {rows} = await ctx.db.query(query, [email]);
    return rows[0];
}

//find user by id
const findUserById = async(id, ctx = {db: conn}) => {
    const query = `
        SELECT id, name, email, password, role, provider, email_verified_at, google_id, avatar, created_at, updated_at
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
        SELECT id, name, email, password, role, provider, email_verified_at, google_id, avatar, created_at, updated_at
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

const findUserByGoogleId = async (googleId, ctx) => {
    const {rows} = await ctx.db.query(
        `SELECT id, name, email, role, provider, email_verified_at, google_id, avatar, created_at
         FROM users WHERE google_id = $1`,
        [googleId]
    );
    return rows[0];
};

const storeEmailVerificationToken = async (data, ctx) => {
    const {rows} = await ctx.db.query(
        `INSERT INTO email_verification_tokens(user_id, token_hash, pending_google_id, expires_at, used_at)
         VALUES($1, $2, $3, $4, NULL)
         ON CONFLICT (user_id) DO UPDATE
         SET token_hash = EXCLUDED.token_hash,
             pending_google_id = EXCLUDED.pending_google_id,
             expires_at = EXCLUDED.expires_at,
             used_at = NULL,
             created_at = NOW()
         RETURNING user_id`,
        [data.userId, data.tokenHash, data.pendingGoogleId ?? null, data.expiresAt]
    );
    return rows[0];
};

const findEmailVerificationToken = async (tokenHash, ctx) => {
    const {rows} = await ctx.db.query(
        `SELECT user_id, pending_google_id, expires_at, used_at
         FROM email_verification_tokens
         WHERE token_hash = $1
         FOR UPDATE`,
        [tokenHash]
    );
    return rows[0];
};

const markEmailVerified = async (data, ctx) => {
    const {rows} = await ctx.db.query(
        `UPDATE users SET email_verified_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND email_verified_at IS NULL
         RETURNING id, email, email_verified_at`,
        [data.userId]
    );
    return rows[0];
};

const markEmailVerificationTokenUsed = async (tokenHash, ctx) => {
    const {rows} = await ctx.db.query(
        `UPDATE email_verification_tokens SET used_at = NOW()
         WHERE token_hash = $1 AND used_at IS NULL
         RETURNING user_id`,
        [tokenHash]
    );
    return rows[0];
};

const createGoogleLinkState = async (data, ctx) => {
    await ctx.db.query("DELETE FROM google_link_states WHERE expires_at <= NOW()");
    const {rows} = await ctx.db.query(
        `INSERT INTO google_link_states(state_hash, user_id, expires_at)
         VALUES($1, $2, $3) RETURNING state_hash`,
        [data.stateHash, data.userId, data.expiresAt]
    );
    return rows[0];
};

const consumeGoogleLinkState = async (stateHash, ctx) => {
    const {rows} = await ctx.db.query(
        `DELETE FROM google_link_states
         WHERE state_hash = $1 AND expires_at > NOW()
         RETURNING user_id`,
        [stateHash]
    );
    return rows[0];
};

const attachGoogleIdentity = async (data, ctx) => {
    const {rows} = await ctx.db.query(
        `UPDATE users SET google_id = $2, updated_at = NOW()
         WHERE id = $1 AND (google_id IS NULL OR google_id = $2)
         RETURNING id, email, google_id`,
        [data.userId, data.googleId]
    );
    return rows[0];
};

//Add Idempotency Key
const addIdempotencyKey = async (data, ctx = {db: conn}) => {
    const query = `
        INSERT INTO idempotency_keys(user_id, idempotency_key, request_hash, status)
        VALUES($1, $2, $3, $4)
        ON CONFLICT (user_id, idempotency_key)
        DO UPDATE SET
            request_hash = EXCLUDED.request_hash,
            status = 'in_progress',
            response_status = NULL,
            response_body = NULL,
            created_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours'
        WHERE idempotency_keys.status = 'completed'
            AND idempotency_keys.expires_at <= NOW()
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [
        data.userId,
        data.idKey,
        data.requestHash,
        data.status ?? "in_progress"
    ]);
    return rows[0];
}

//Store the successful response in the same transaction as the order.
const completeIdempotencyKey = async (data, ctx = {db: conn}) => {
    const query = `
        UPDATE idempotency_keys
        SET status = 'completed', response_status = $4, response_body = $5
        WHERE user_id = $1
            AND idempotency_key = $2
            AND request_hash = $3
            AND status = 'in_progress'
        RETURNING id
    `;

    const {rows} = await ctx.db.query(query, [
        data.userId,
        data.idKey,
        data.requestHash,
        data.responseStatus,
        data.responseBody
    ]);
    return rows[0];
}

//Get Idempotency Key
const getIdempotencyKey = async (data, ctx = {db: conn}) => {
    const query = `
        SELECT idempotency_key, request_hash, status, response_status, response_body
        FROM idempotency_keys
        WHERE user_id = $1
            AND idempotency_key = $2
            AND (expires_at > NOW() OR status = 'in_progress')
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
    findUserByGoogleId,
    storeEmailVerificationToken,
    findEmailVerificationToken,
    markEmailVerified,
    markEmailVerificationTokenUsed,
    createGoogleLinkState,
    consumeGoogleLinkState,
    attachGoogleIdentity,
    addIdempotencyKey,
    completeIdempotencyKey,
    getIdempotencyKey
}
