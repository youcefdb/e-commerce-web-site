import express from 'express';
import cors from "cors";
import helmet from "helmet";
import cookieParser from 'cookie-parser';
import verifyJwtToken from './middleware/jwtVerification.middleware.js';
import roleAuthorize from "./middleware/roleCheck.middleware.js";
import corsValidation from './middleware/corsValidation.middleware.js';
import PERMISSION from "./config/roles.config.js";
import authRoot from './modules/auth/auth.root.js';
import userRoot from './modules/users/root.users.js';
import productRoot from './modules/products/product.root.js';
import cartRoot from './modules/cart/cart.root.js';
import categoriesRoot from './modules/categories/categories.root.js';
import reviewRoot from './modules/reviews/reviews.root.js';
import whiteListRoot from './modules/wishlist/wishlist.root.js';
import orderRoot from './modules/orders/orders.root.js';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import path from 'path';

const app = express();

//Allowed origin for accessing our server 
app.use(corsValidation());
app.use("/upload", express.static(path.join(process.cwd(), "upload")))

//Allowed some origins to read JS thier responce
app.use(cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : 'http://localhost:3000',
    credentials: true
}))

//Add secure headers
app.use(helmet());
//Middleware for parsing cookie and set theme on request 
app.use(cookieParser());
//Middleware for parsing Json format into readable format (body)
app.use(express.json());


app.use("/api/v1/auth", authLimiter, authRoot);
app.use(apiLimiter);
app.use("/api/v1/products", productRoot);
app.use("/api/v1/categories", categoriesRoot);
app.use("/api/v1/reviews", reviewRoot);

app.use(verifyJwtToken, roleAuthorize(PERMISSION.CUSTOMER, PERMISSION.ADMIN));
app.use("/api/v1/users", userRoot);
app.use("/api/v1/cart", cartRoot);
app.use("/api/v1/whishLists", whiteListRoot);
app.use("/api/v1/orders", orderRoot);

export default app;