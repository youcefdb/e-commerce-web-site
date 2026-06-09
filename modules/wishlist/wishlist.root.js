import express from "express";
import * as wishlistController from "./wishlist.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import { addToWishListSchema, delteFromWishlistSchema, getWishListSchema} from "./wishLost.validation.js";

const wishlistRoot = express.Router();

wishlistRoot
    .get("/v1/", schemaValidator(getWishListSchema), wishlistController.getWhishlist)
    .post("/v1/", schemaValidator(addToWishListSchema), wishlistController.addTowishlist)
    .delete("/:id/v1/", schemaValidator(delteFromWishlistSchema), wishlistController.deleteFromWhishList)

export default wishlistRoot;