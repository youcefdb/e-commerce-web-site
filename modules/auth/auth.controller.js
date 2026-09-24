import { AppError } from "../../errors/errors.js";
import * as authServices from "./auth.services.js";

//Create new account 
const register = async(req, res) => {
    try {
        const {
            message,
            accessToken,
            refreshToken,
            csrfToken, 
            user
        } = await authServices.register(
            req.body,
            req.headers["user-agent"],
            req.ip
        );

        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 30,
            secure: true,
            sameSite: "strict"
        });

        res.cookie("csrf-token", csrfToken, {
            httpOnly: false,
            secure: true,
            sameSite: "strict"
        });

        return res.status(201).json({
            message,
            accessToken,
            refreshToken,
            user
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Login using system email
const login = async(req, res) => {
    try {
        const {accessToken, refreshToken, user} = await authServices.login(
            req.body, 
            req.headers["user-agent"], 
            req.ip
        );
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 30,
            secure: true,
            sameSite: "strict"
        });

        return res.json({
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Build google URL for login
const buildGoogleAuthUrl = async(req, res) => {
    try {
        const {url, state} = await authServices.buildGoogleAuthUrl();
        res.cookie("oauth_state", state, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });
        res.redirect(url);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Login via google account
const googleLogin = async(req, res) => {
    try {
        if (!req.query.code) {
            throw AppError("Missing authorization code", 400);
        }

        if (req.query.state !== req.cookies.oauth_state) {
            throw AppError("Invalid OAuth state", 401);
        }
        res.clearCookie("oauth_state");
        const {accessToken, refreshToken} = await authServices.googleLogin(
            req.query.code, 
            req.headers["user-agent"], 
            req.ip
        );

        res.cookie("jwt", refreshToken, 
            {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
                maxAge: 1000 * 60 * 60 * 24 * 30
            });
        return res.status(200).json({
            accessToken: accessToken
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Refresh access token
const refreshAccessToken = async(req, res) => {
    try {

        const cookies = req.cookies?.jwt ? req.cookies : { jwt: req.body?.refreshToken };
        const {accessToken, refreshToken} = await authServices.refreshAccessToken(
            cookies,
            req.headers['user-agent'],
            req.ip
        )

        res.cookie('jwt', refreshToken,
            {
                httpOnly: true,
                sameSite: "strict",
                secure: false,
                maxAge: 1000 * 60 * 60 * 24 * 30
            }
        );

        return res.status(200).json({
            accessToken: accessToken
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Logout and delete refresh token from DB
const logout = async(req, res) => {
    try {
        const cookies = req.cookies?.jwt ? req.cookies : { jwt: req.body?.refreshToken };
        await authServices.logout(cookies);
        res.clearCookie("jwt");
        return res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

export{
    register,
    login,
    logout,
    buildGoogleAuthUrl,
    googleLogin,
    refreshAccessToken
}