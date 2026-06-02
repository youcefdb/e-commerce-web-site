import * as authServices from "./auth.services.js";

//Create new account 
const register = async(req, res) => {
    try {
        console.log(req.body);
        await authServices.register(req.body);
        return res.status(201);
    } catch (error) {
        return res.status(201).json({
            message: "User created successfully"
        });
    }
}

//Login using system email
const login = async(req, res) => {
    try {
        const {accessToken, refreshToken} = await authServices.login(
            req.body, 
            req.headers["user-agent"], 
            req.ip
        );
        res.cookie("jwt", refreshToken, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30});

        return res.json(accessToken);
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
            throw new AppError("Missing authorization code", 400);
        }

        if (req.query.state !== req.cookies.oauth_state) {
            throw new AppError("Invalid OAuth state", 401);
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
                sameSite: "lax",
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

        const {accessToken, refreshToken} = await authServices.refreshAccessToken(
            req.cookies,
            req.headers['user-agent'],
            req.ip
        )

        res.cookie('jwt', refreshToken,
            {
                httpOnly: true,
                sameSite: "lax",
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
        await authServices.logout(req.cookies);
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