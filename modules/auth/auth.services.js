import * as userRepo from "./auth.repo.js";
import bcrypt from "bcrypt";
import withTransaction from "../../utils/transaction.js";
import {generateAccessToken, generateRefreshToken} from "../../utils/token.js";
import {AppError, throwIfNotFound} from '../../errors/errors.js';

const register = async (data) => {
    return withTransaction(async(client) => {
        var user = await userRepo.findUserByEmail(data.email, {db: client});
        if (user) {
            throw AppError("Wrong password", 401);
        }

        const hashPs = await bcrypt.hash(data.password_hash, 10);

        const newData = [...data, password = hashPs, avatar = avatar ?? null];
        user = await userRepo.createUser(newData, {db: client});
        
        return{
            message: "user created successfully"
        };
    });
}

const login = async (data, device, ip) => {
    return withTransaction(async(client) => {
        const user = await userRepo.findUserByEmail(data.email, {db: client});
        throwIfNotFound(user, "Email does not exists");

        const validPw = await bcrypt.compare(data.password, user.password);
        if (!validPw) {
            throw AppError("Email or Password incorrect", 401);
        }

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user);

        const hashedToken = await storeRefreshToken(
            {
                userId: user.id,
                token: refreshToken,
                device: device,
                ip_address: ip_address
            },
            {db: client}
        );

        return {
            accessToken,
            refreshToken
        }
    });
}

export {
    register,
    login
}