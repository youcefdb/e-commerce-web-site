import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import bcrypt from 'bcrypt';
import crypto from "crypto";
import { storeRefreshToken } from '../modules/auth/auth.repo.js';
dotenv.config();

//generate access token
const generateAccessToken = (user) => {
    const userInfo = {
        id: user.id,
        role: user.role
    }
    return jwt.sign(
        {userInfo},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "15m"}
    )
}


//generate refresh token
const generateRefreshToken = (user) => {
    const userInfo = {
        id: user.id,
        role: user.role
    }

    return jwt.sign(
        {userInfo},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "30d"}
    );
}

//Generating token and store to database
const generateAndStoreTokens = async (user, device, ip, client) => {
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    const refreshTokenDecoded = jwt.decode(refreshToken);
    const tokenExpiredDate = new Date(refreshTokenDecoded.exp * 1000);


    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
        await storeRefreshToken(
        {
            userId: user.id,
            token: hashedToken,
            expiresAt: tokenExpiredDate,
            device: device,
            ip_address: ip
        },
        {db: client}
    );
    return {
        accessToken,
        refreshToken
    }
}

export {
    generateAccessToken,
    generateRefreshToken,
    generateAndStoreTokens
}