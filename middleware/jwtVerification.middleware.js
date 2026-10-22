import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import conn from "../config/db.config.js";

dotenv.config();

const verifyJwtToken = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.sendStatus(401);
    }

    const accessToken = header.slice("Bearer ".length);
    let decode;
    try {
        decode = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch {
        return res.sendStatus(403);
    }

    if (!decode?.userInfo?.id || !decode.userInfo.role) {
        return res.sendStatus(403);
    }

    try {
        // Check current verification state so an old access token cannot
        // continue working after the account email is changed.
        const {rows} = await conn.query(
            "SELECT email_verified_at FROM users WHERE id = $1",
            [decode.userInfo.id]
        );
        if (!rows[0]) return res.sendStatus(401);
        if (!rows[0].email_verified_at) {
            return res.status(403).json({message: "Please verify your email before accessing this resource."});
        }

        req.user = {
            id: decode.userInfo.id,
            role: decode.userInfo.role
        };
        return next();
    } catch (error) {
        return next(error);
    }
};

export default verifyJwtToken;
