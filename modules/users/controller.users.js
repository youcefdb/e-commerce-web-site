import * as userServices from "../users/services.users.js";

//Update user profile
const updateUser = async (req, res) => {
    try {
        const result = await userServices.updateUser(req.user.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Get user profile
const viewProfile = async(req, res) => {
    try {
        const result = await userServices.viewProfile(req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}
export{
    updateUser,
    viewProfile
}