import jwt from 'jsonwebtoken';

//generate access token
const generateAccessToken = (user) => {
    const userInfo = {
        id: user.id,
        role: user.role
    }
    return jwt.sign(
        {userInfo},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "1d"}
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

export {
    generateAccessToken,
    generateRefreshToken
}