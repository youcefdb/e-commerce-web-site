import { AppError } from "../../errors/errors.js";
import asyncHandler from "../../utils/tryCatch.util.js";
import * as authServices from "./auth.services.js";

const REFRESH_TOKEN_COOKIE = "jwt";
const REFRESH_TOKEN_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const OAUTH_STATE_COOKIE = "oauth_state";
const GOOGLE_LINK_STATE_COOKIE = "google_link_state";
const OAUTH_STATE_COOKIE_MAX_AGE = 1000 * 60 * 10;

const oauthStateCookieOptions = () => ({
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth"
});

const refreshTokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth"
});

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        ...refreshTokenCookieOptions(),
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE
    });
};

//Create new account 
const register = asyncHandler(async(req, res) =>{
    const result = await authServices.register(
            req.body,
            req.headers["user-agent"],
            req.ip
        );
    return res.status(201).json(result);
});

const resendVerification = asyncHandler(async(req, res) => {
    const result = await authServices.resendVerification(req.body);
    return res.status(200).json(result);
});

const verifyEmail = asyncHandler(async(req, res) => {
    const {token, confirm} = req.validatedQuery;
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    if (confirm !== "1") {
        return res.status(200).type("html").send(`
            <!doctype html><html lang="en"><meta charset="utf-8">
            <title>Verify email</title><body>
            <h1>Verify your email address</h1>
            <p>Continue to confirm that you own this email address.</p>
            <form method="get" action="/auth/verify-email">
                <input type="hidden" name="token" value="${token}">
                <input type="hidden" name="confirm" value="1">
                <button type="submit">Confirm email</button>
            </form></body></html>`);
    }
    const result = await authServices.verifyEmail(token);
    if (req.accepts(["html", "json"]) === "json") {
        return res.status(200).json(result);
    }
    return res.status(200).type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Email verified</title><body><h1>Email verified</h1><p>${result.message}</p></body></html>`);
});

const login = asyncHandler(async(req, res) =>{
        const {accessToken, refreshToken, user} = await authServices.login(
            req.body, 
            req.headers["user-agent"], 
            req.ip
        );
        setRefreshTokenCookie(res, refreshToken);

        return res.json({
            accessToken,
            user
        });
})

//Build google URL for login
const buildGoogleAuthUrl = asyncHandler((req, res) => {
        res.clearCookie(GOOGLE_LINK_STATE_COOKIE, oauthStateCookieOptions());
        const {url, state} = authServices.buildGoogleAuthUrl();
        res.cookie(OAUTH_STATE_COOKIE, state, {
            ...oauthStateCookieOptions(),
            maxAge: OAUTH_STATE_COOKIE_MAX_AGE
        });
        res.redirect(url);
});

const startGoogleLink = asyncHandler(async(req, res) => {
    res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions());
    const {url, state} = await authServices.buildGoogleLinkUrl(req.user.id);
    res.cookie(GOOGLE_LINK_STATE_COOKIE, state, {
        ...oauthStateCookieOptions(),
        maxAge: OAUTH_STATE_COOKIE_MAX_AGE
    });
    return res.status(200).json({url});
});

const getFrontendAuthUrl = (path, query = {}) => {
    const frontendUrl = new URL(process.env.CLIENT_URL);
    frontendUrl.pathname = path;
    frontendUrl.search = "";
    frontendUrl.hash = "";
    for (const [key, value] of Object.entries(query)) {
        frontendUrl.searchParams.set(key, value);
    }
    return frontendUrl.toString();
};

//Login via google account
const googleLogin = asyncHandler(async(req, res) => {
        const callbackUrl = getFrontendAuthUrl("/auth/callback");
        const failureUrl = getFrontendAuthUrl("/login", {googleError: "failed"});
        const conflictUrl = getFrontendAuthUrl("/login", {googleError: "account_conflict"});
        const emailConfirmUrl = getFrontendAuthUrl("/login", {googleError: "verify_email"});

        const state = req.query.state;
        const code = req.query.code;

        if (req.cookies?.[GOOGLE_LINK_STATE_COOKIE]) {
            const linkState = req.cookies[GOOGLE_LINK_STATE_COOKIE];
            res.clearCookie(GOOGLE_LINK_STATE_COOKIE, oauthStateCookieOptions());
            if (typeof state !== "string" || state !== linkState || typeof code !== "string" || !code || req.query.error) {
                return res.redirect(302, getFrontendAuthUrl("/auth/callback", {googleLinkError: "failed"}));
            }
            try {
                await authServices.linkGoogleAccount(code, state);
                return res.redirect(302, getFrontendAuthUrl("/auth/callback", {googleLinked: "success"}));
            } catch {
                return res.redirect(302, getFrontendAuthUrl("/auth/callback", {googleLinkError: "failed"}));
            }
        }

        res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions());
        const stateCookie = req.cookies?.[OAUTH_STATE_COOKIE];
        if (
            typeof state !== "string"
            || typeof stateCookie !== "string"
            || stateCookie.length === 0
            || state !== stateCookie
        ) {
            return res.redirect(302, failureUrl);
        }

        if (typeof req.query.error === "string" || typeof code !== "string" || !code) {
            return res.redirect(302, failureUrl);
        }

        try {
            const {refreshToken} = await authServices.googleLogin(
                code,
                req.headers["user-agent"],
                req.ip
            );
            if (typeof refreshToken !== "string" || !refreshToken) {
                throw AppError("Google authentication failed", 502);
            }

            setRefreshTokenCookie(res, refreshToken);
            return res.redirect(302, callbackUrl);
        } catch (error) {
            if (error?.code === "GOOGLE_EMAIL_CONFIRMATION_REQUIRED") {
                return res.redirect(302, emailConfirmUrl);
            }
            return res.redirect(302, error?.statusCode === 409 ? conflictUrl : failureUrl);
        }
})

//Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
        const {accessToken, refreshToken} = await authServices.refreshAccessToken(
            req.cookies,
            req.headers['user-agent'],
            req.ip
        )

        setRefreshTokenCookie(res, refreshToken);

        return res.status(200).json({
            accessToken: accessToken
        });
})

//Logout and delete refresh token from DB
const logout = asyncHandler(async(req, res) => {
    try {
        await authServices.logout(req.cookies);
    } finally {
        res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions());
    }
    return res.status(200).json({message: "Logged out successfully"});
});

export{
    register,
    login,
    logout,
    buildGoogleAuthUrl,
    googleLogin,
    refreshAccessToken,
    resendVerification,
    verifyEmail,
    startGoogleLink
}
