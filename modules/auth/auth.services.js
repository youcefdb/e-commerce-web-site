import * as authRepo from "./auth.repo.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import withTransaction from "../../utils/transaction.util.js";
import {generateAndStoreTokens} from "../../utils/token.util.js";
import {AppError, throwIfNotFound} from '../../errors/errors.js';

dotenv.config();

//Sign in
const register = async (data) => {
    return withTransaction(async(client) => {
        var user = await authRepo.findUserByEmail(data.email, {db: client});
        if (user) {
            throw AppError("Wrong password", 401);
        }
        
        const hashPs = await bcrypt.hash(data.password, 10);
        const newData = {...data, password: hashPs};
        user = await authRepo.createUser(newData, {db: client});
        
        const {accessToken, refreshToken} = await generateAndStoreTokens(user);
        
        return{
            message: "user created successfully",
            accessToken,
            refreshToken
        };
    });
}

//Log in
const login = async (data, device, ip) => {
    return withTransaction(async(client) => {
        const user = await authRepo.findUserByEmail(data.email, {db: client});
        if (!user.password) {
            throw new AppError("This account uses Google Sign-In", 401);
        }

        throwIfNotFound(user, "Invalid email or password");

        const validPw = await bcrypt.compare(data.password, user.password);
        if (!validPw) {
            throw AppError("Email or Password incorrect", 401);
        }

        const {accessToken, refreshToken} = await generateAndStoreTokens(user, device, ip, client);

        return {
            accessToken,
            refreshToken
        }
    });
}

//Build google URL
const buildGoogleAuthUrl = () => {
    const redirectUri = 'http://localhost:3500/auth/google/callback';
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

//Get user google profile
const googleUserProfile = async (code) => {
    const redirectUri = 'http://localhost:3500/auth/google/callback';
    try {
            var tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        // console.log(tokenRes.data);
    } catch (error) {
        console.log(error.response?.data);
    throw error;
    }

    throwIfNotFound(tokenRes.data.access_token, "Google Access Token not found");
    const googleProfile = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
            headers: {Authorization: `Bearer ${tokenRes.data.access_token}`}
        }
    );

    console.log(googleProfile.data.name, googleProfile.data.email);
    return googleProfile.data;
}

//Login via google account
const googleLogin = async (code, device, ip) => {
    return withTransaction(async(client) => {
        const googleProfile = await googleUserProfile(code);
        var user = await authRepo.findUserByEmail(googleProfile.email, {db: client});
        if (googleProfile.email_verified === false) {
            throw AppError("Google account email is not verified", 401);
        }
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

        console.log(accessToken);

        return {
            accessToken,
            refreshToken
        };
    })
}

//Refresh access token
const refreshAccessToken = async (cookies, device, ip) => {
    return withTransaction(async(client) => {

        if (!cookies?.jwt) {
            throw AppError("Unauthorized", 401);
        }

        console.log(cookies.jwt)

        const oldRefreshToken = cookies.jwt;

        const decode = await jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        if (!decode) {
            throw AppError("Unauthorized", 401);
        }
        const userId = decode.userInfo.id;

        const user = await authRepo.findUserById(userId, {db: client});
        throwIfNotFound(user, "Unauthorized");

        const hashedRefreshToken = crypto.createHash("sha256").update(oldRefreshToken).digest("hex");
        const validation = await authRepo.findRefreshToken(hashedRefreshToken, {db: client});
        
        //Handle Reuse token Attack
        if (!validation) {
            await authRepo.logoutAllSession(userId, {db: client});
            throw AppError("Unauthorized", 401);
        }

        const newUser = {id: user.id, role: user.role, hashedRefreshToken: hashedRefreshToken};
        return await replaceRefreshToken(newUser, device, ip, client);
    });
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