import * as authRepo from "./auth.repo.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import Joi from "joi";
import withTransaction from "../../utils/transaction.util.js";
import {generateAndStoreTokens} from "../../utils/token.util.js";
import {AppError, throwIfNotFound} from '../../errors/errors.js';
import { assertEmailDeliveryConfigured, sendVerificationEmail } from "./email.service.js";
import conn from "../../config/db.config.js";

dotenv.config();

// Fixed bcrypt hash used to keep password-login work similar when no stored hash exists.
const DUMMY_PASSWORD_HASH = "$2b$10$h5KjrPP2TcQqYEbfZaL9YuNg98PDIDZxtBvsrh8qZPQVFhBIai0/W";
const GOOGLE_REQUEST_TIMEOUT_MS = 10_000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const GOOGLE_LINK_STATE_TTL_MS = 10 * 60 * 1000;

const hashValue = (value) => crypto.createHash("sha256").update(value).digest("hex");

const createVerification = async (userId, client, pendingGoogleId = null) => {
    const token = crypto.randomBytes(32).toString("base64url");
    await authRepo.storeEmailVerificationToken({
        userId,
        tokenHash: hashValue(token),
        pendingGoogleId,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
    }, {db: client});
    return token;
};

//Sign in
const register = async (data, device, ip) => {
    assertEmailDeliveryConfigured();
    const registration = await withTransaction(async(client) => {
        const email = data.email.toLowerCase();
        const existingUser = await authRepo.findUserByEmail(email, {db: client});
        if (existingUser) {
            throw AppError("Email already exists", 409);
        }
        
        const hashPs = await bcrypt.hash(data.password, 10);

        const user = await authRepo.createUser({
            ...data,
            email,
            password: hashPs,
            provider: "local"
        }, {db: client});
        const token = await createVerification(user.id, client);
        return {email: user.email, token};
    });

    try {
        await sendVerificationEmail(registration.email, registration.token);
    } catch {
        throw AppError("Account created, but the verification email could not be sent. Please request another email.", 503);
    }
    return {message: "Account created. Check your email for a verification link."};
}

//Log in
const login = async (data, device, ip) => {
    const result = await withTransaction(async(client) => {
        const user = await authRepo.findUserByEmail(data.email.toLowerCase(), {db: client});
        const hasPassword = Boolean(user?.password);
        const passwordHash = hasPassword ? user.password : DUMMY_PASSWORD_HASH;
        const validPw = await bcrypt.compare(data.password, passwordHash);

        if (!user || !hasPassword || !validPw) {
            throw AppError("Invalid email or password.", 401);
        }

        if (!user.email_verified_at) {
            throw AppError("Please verify your email before logging in.", 403);
        }

        const {accessToken, refreshToken} = await generateAndStoreTokens(user, device, ip, client);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                created_at: user.created_at
            }
        }
    });
    return result;
}

//Build google URL
const buildGoogleAuthUrl = () => {
    const redirectUri = process.env.REDIRECT_URI;
    const clientId = process.env.CLIENT_ID;
    const state = crypto.randomUUID();
    
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
        state
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
        
    return {
        url,
        state
    };
}

//Get user profile
const googleUserProfile = async (code) => {
    const tokenParams = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
    });

    let tokenRes;
    try {
        tokenRes = await axios.post(
            'https://oauth2.googleapis.com/token',
            tokenParams.toString(),
            {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                timeout: GOOGLE_REQUEST_TIMEOUT_MS
            }
        );
    } catch (error) {
        throw AppError("Google authentication failed", 502 );
    }

    throwIfNotFound(tokenRes.data.access_token, "Google Access Token not found");
    let googleProfile;
    try {
        googleProfile = await axios.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: {Authorization: `Bearer ${tokenRes.data.access_token}`},
                timeout: GOOGLE_REQUEST_TIMEOUT_MS
            });
    } catch (error) {
        throw AppError("Google authentication failed", 502);
    }
    return googleProfile.data;
}

//Login via google account
const googleLogin = async (code, device, ip) => {
    const googleProfile = await googleUserProfile(code);

    //Check if user's email has been verified
    if (googleProfile.verified_email !== true) {
        throw AppError("Google account email is not verified", 401);
    }

    //Check user's email validation
    const {error: emailError} = Joi.string().email().required().validate(googleProfile.email);
    if (emailError || typeof googleProfile.id !== "string" || !googleProfile.id) {
        throw AppError("Invalid Google account email", 401);
    }

    const result = await withTransaction(async(client) => {
        const googleId = googleProfile.id;
        const email = googleProfile.email.toLowerCase();
        let user = await authRepo.findUserByGoogleId(googleId, {db: client});

        if (user) {
            if (!user.email_verified_at) {
                throw AppError("Please verify your email before logging in.", 403);
            }
            const {accessToken, refreshToken} = await generateAndStoreTokens(user, device, ip, client);
            return {accessToken, refreshToken};
        }

        user = await authRepo.findUserByEmail(email, {db: client});
        // Legacy Google accounts have no saved stable ID. Confirm email ownership
        // before binding one; never infer identity from a matching email alone.
        if (user?.provider === "google" && !user.google_id) {
            const token = await createVerification(user.id, client, googleId);
            return {pendingGoogleVerification: {email: user.email, token}};
        } else if (user) {
            const error = AppError("An account already uses this email. Sign in to that account and link Google from your account settings.", 409);
            error.code = "GOOGLE_ACCOUNT_CONFLICT";
            throw error;
        }

        if (!user) {
            user = await authRepo.createUser(
                {
                    name: googleProfile.name || email.split("@")[0],
                    email,
                    password: null,
                    provider: 'google',
                    emailVerifiedAt: new Date(),
                    googleId
                },
                {db: client});
        }

        const {accessToken, refreshToken} = await generateAndStoreTokens(user, device, ip, client);

        return {
            accessToken,
            refreshToken
        };
    });

    if (result.pendingGoogleVerification) {
        await sendVerificationEmail(
            result.pendingGoogleVerification.email,
            result.pendingGoogleVerification.token
        );
        const error = AppError("Confirm the email verification link we sent before signing in with this Google account.", 409);
        error.code = "GOOGLE_EMAIL_CONFIRMATION_REQUIRED";
        throw error;
    }
    return result;
}

const resendVerification = async (data) => {
    assertEmailDeliveryConfigured();
    const email = data.email.toLowerCase();
    const user = await authRepo.findUserByEmail(email, {db: conn});
    const passwordHash = user?.password || DUMMY_PASSWORD_HASH;
    const validPassword = await bcrypt.compare(data.password, passwordHash);

    if (user && user.password && !user.email_verified_at && validPassword) {
        const token = await withTransaction(async(client) => {
            const currentUser = await authRepo.findUserByIdForShare(user.id, {db: client});
            if (!currentUser || currentUser.email !== email || currentUser.email_verified_at) {
                return null;
            }
            return createVerification(currentUser.id, client);
        });

        if (token) {
            await sendVerificationEmail(email, token);
        }
    }

    // Avoid exposing whether an address has an account.
    return {message: "If the credentials match an unverified account, a verification email has been sent."};
};

const verifyEmail = async (token) => {
    const tokenHash = hashValue(token);
    const result = await withTransaction(async(client) => {
        const record = await authRepo.findEmailVerificationToken(tokenHash, {db: client});
        if (!record) return {invalid: true};
        if (record.used_at) return {used: true};
        if (new Date(record.expires_at).getTime() <= Date.now()) return {expired: true};

        const user = await authRepo.markEmailVerified({userId: record.user_id}, {db: client});
        if (record.pending_google_id) {
            const linkedUser = await authRepo.attachGoogleIdentity({
                userId: record.user_id,
                googleId: record.pending_google_id
            }, {db: client});
            if (!linkedUser) {
                throw AppError("This Google account is already linked to another account.", 409);
            }
        }
        await authRepo.markEmailVerificationTokenUsed(tokenHash, {db: client});
        return {
            verified: Boolean(user),
            googleLinked: Boolean(record.pending_google_id),
            alreadyVerified: !user && !record.pending_google_id
        };
    });

    if (result.invalid) throw AppError("Verification link is invalid.", 400);
    if (result.used) throw AppError("Verification link has already been used.", 409);
    if (result.expired) throw AppError("Verification link has expired. Request a new one.", 410);
    if (result.alreadyVerified) throw AppError("Email address is already verified.", 409);
    return {message: result.googleLinked
        ? "Email verified and Google account linked. You can now sign in with Google."
        : "Email address verified. You can now log in."};
};

const buildGoogleLinkUrl = async (userId) => {
    const state = crypto.randomBytes(32).toString("base64url");
    await withTransaction(async(client) => {
        await authRepo.createGoogleLinkState({
            stateHash: hashValue(state),
            userId,
            expiresAt: new Date(Date.now() + GOOGLE_LINK_STATE_TTL_MS)
        }, {db: client});
    });
    const url = new URL(buildGoogleAuthUrl().url);
    url.searchParams.set("state", state);
    return {url: url.toString(), state};
};

const linkGoogleAccount = async (code, state) => {
    const googleProfile = await googleUserProfile(code);
    if (googleProfile.verified_email !== true || typeof googleProfile.id !== "string" || !googleProfile.id) {
        throw AppError("Google account email is not verified", 401);
    }

    return withTransaction(async(client) => {
        const link = await authRepo.consumeGoogleLinkState(hashValue(state), {db: client});
        if (!link) throw AppError("Google link request is invalid or expired. Start again from account settings.", 400);

        const currentUser = await authRepo.findUserById(link.user_id, {db: client});
        if (!currentUser?.email_verified_at) {
            throw AppError("Verify your account email before linking Google.", 403);
        }

        const linkedUser = await authRepo.attachGoogleIdentity({
            userId: link.user_id,
            googleId: googleProfile.id
        }, {db: client});
        if (!linkedUser) {
            throw AppError("This Google account is already linked to another account.", 409);
        }

        // Linking preserves the existing signed-in account and adds Google as
        // another way to identify it; it never changes the account email.
        return {linked: true};
    });
};

//Refresh access token
const refreshAccessToken = async (cookies, device, ip) => {
    if (!cookies?.jwt) {
        throw AppError("Unauthorized", 401);
    }

    const oldRefreshToken = cookies.jwt;
    let decode;
    try {
        decode = jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    } catch (error) {
        throw AppError("Unauthorized", 401);
    }

    const userId = decode.userInfo.id;
    const hashedRefreshToken = crypto.createHash("sha256").update(oldRefreshToken).digest("hex");

    let result;
    try {
        result = await withTransaction(async(client) => {
            const user = await authRepo.findUserByIdForShare(userId, {db: client});
            throwIfNotFound(user, "Unauthorized");

            if (!user.email_verified_at) {
                await authRepo.logoutAllSession(userId, {db: client});
                return {unverified: true};
            }

            const validation = await authRepo.findRefreshToken(
                {token: hashedRefreshToken, userId},
                {db: client}
            );

            if (!validation) {
                await authRepo.logoutAllSession(userId, {db: client});
                return {reuse: true};
            }

            const newUser = {id: user.id, role: user.role, hashedRefreshToken};
            const tokens = await replaceRefreshToken(newUser, device, ip, client);
            return {reuse: false, tokens};
        });
    } catch (error) {
        //Another request is currently rotating this token; reject it without treating it as reuse.
        if (error.code === "55P03") {
            throw AppError("Unauthorized", 401);
        }
        throw error;
    }

    //A validly signed token without an active stored record follows the existing reuse policy.
    if (result.unverified) {
        throw AppError("Please verify your email before logging in.", 403);
    }
    if (result.reuse) {
        throw AppError("Unauthorized", 401);
    }

    return result.tokens;
}

//Logout and delete refresh token from DB
const logout = async (cookie) => {
    return withTransaction(async(client) => {
        if (!cookie?.jwt) {
            throw AppError("Unauthorized", 401);
        }
        const refreshToken = cookie.jwt;
        const hachedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
        const result = await authRepo.deleteRefreshToken(hachedRefreshToken, {db:client});
        throwIfNotFound(result, "Failed to log out");
    });
}

//Generate and delete old refresh token
const replaceRefreshToken = async (user, device, ip, client) => {
    await authRepo.deleteRefreshToken(user.hashedRefreshToken, {db: client});
    return await generateAndStoreTokens(user, device, ip, client);
}

export {
    register,
    login,
    buildGoogleAuthUrl,
    googleLogin,
    resendVerification,
    verifyEmail,
    buildGoogleLinkUrl,
    linkGoogleAccount,
    refreshAccessToken,
    logout
}
