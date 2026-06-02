import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const config = dotenv.config();

const verifyJwtToken = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.sendStatus(401);
    }
    
    // console.log(req.headers);

    const accessToken = header.split(' ')[1];

    jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (error, decode) => {
            if (error) {
                return res.sendStatus(403);
            }

            req.user = {
                id: decode.userInfo.id,
                role: decode.userInfo.role
            }
            next();
        }
    )

}


export default verifyJwtToken;