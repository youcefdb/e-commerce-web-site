import express from "express";
import * as wishlistController from "./wishlist.controller.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import { addToWishListSchema, delteFromWishlistSchema, getWishListSchema} from "./wishLost.validation.js";

const wishlistRoot = express.Router();

wishlistRoot
    .get("/", schemaValidator(getWishListSchema), wishlistController.getWhishlist)
    .post("/", schemaValidator(addToWishListSchema), wishlistController.addTowishlist)
    .delete("/:id", schemaValidator(delteFromWishlistSchema), wishlistController.deleteFromWhishList)

export default wishlistRoot;