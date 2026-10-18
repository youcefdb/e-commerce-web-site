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

dotenv.config();

// Fixed bcrypt hash used to keep password-login work similar when no stored hash exists.
const DUMMY_PASSWORD_HASH = "$2b$10$h5KjrPP2TcQqYEbfZaL9YuNg98PDIDZxtBvsrh8qZPQVFhBIai0/W";

//Sign in
const register = async (data, device, ip) => {
    return withTransaction(async(client) => {
        var user = await authRepo.findUserByEmail(data.email, {db: client});
        if (user) {
            throw AppError("Wrong password", 401);
        }
        
        const hashPs = await bcrypt.hash(data.password, 10);

        //Handle create account with the same email in the same time
        try {
            const newData = {...data, password: hashPs};
            user = await authRepo.createUser(newData, {db: client});
        } catch (error) {
            console.log(error);

            if (error.statusCode === "23505") {
                throw AppError("An account with this email may already exist. Try logging in or resetting your password", 409);
            }
            throw error;
        }
        
        const {
            accessToken,
            refreshToken,
            csrfToken
        } = await generateAndStoreTokens(user, device, ip, client);
        
        return{
            message: "user created successfully",
            accessToken,
            refreshToken,
            csrfToken,
            user
        };
    });
}

//Log in
const login = async (data, device, ip) => {
    return withTransaction(async(client) => {
        const user = await authRepo.findUserByEmail(data.email, {db: client});
        const hasPassword = Boolean(user?.password);
        const passwordHash = hasPassword ? user.password : DUMMY_PASSWORD_HASH;
        const validPw = await bcrypt.compare(data.password, passwordHash);

        if (!user || !hasPassword || !validPw) {
            throw AppError("Invalid email or password.", 401);
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
        scope: "email profile",
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
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }
        );
    } catch (error) {
        throw AppError("Google authentication failed", 502 );
    }

    throwIfNotFound(tokenRes.data.access_token, "Google Access Token not found");
    const googleProfile = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
            headers: {Authorization: `Bearer ${tokenRes.data.access_token}`}
        });
    return googleProfile.data;
}

//Login via google account
const googleLogin = async (code, device, ip) => {
    return withTransaction(async(client) => {
        const googleProfile = await googleUserProfile(code);

        //Check if user's email has been verified
        if (googleProfile.verified_email !== true) {
            throw AppError("Google account email is not verified", 401);
        }

        //Check user's email validation
        const {error: emailError} = Joi.string().email().required().validate(googleProfile.email);
        if (emailError) {
            throw AppError("Invalid Google account email", 401);
        }

        var user = await authRepo.findUserByEmail(googleProfile.email, {db: client});
        if (!user) {
            user = await authRepo.createUser(
                {
                    name: googleProfile.name,
                    email: googleProfile.email,
                    password: null,
                    provider: 'google'
                },
                {db: client});
        }

        const {accessToken, refreshToken} = await generateAndStoreTokens(user, device, ip, client);

        return {
            accessToken,
            refreshToken
        };
    })
}

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
    refreshAccessToken,
    logout
}
