import * as reviewsServices from "./reviews.services.js";

//get product reviews by id
const getReviews = async (req, res) => {
    try {
        const result = await reviewsServices.getReviews(req.params.id, req.query.page, req.query.limit);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//add review to a product
const addReview = async(req, res) => {
    try {
        const result = await reviewsServices.addReview(req.body, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

//Edit review
const editReview = async(req, res) => {
    try {
        const result = await reviewsServices.editReview(req.body, req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
       return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        }); 
    }
}

//Delete review
const deleteReview = async(req, res) => {
    try {
        const result = await reviewsServices.deleteReview(req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
        });
    }
}

export{
    getReviews,
    addReview,
    editReview,
    deleteReview
}