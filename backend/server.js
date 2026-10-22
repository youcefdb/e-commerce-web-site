import express from 'express';
import cors from "cors";
import corsOptions from "./config/cors.config.js";
import helmet from "helmet";
import path from 'path';
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
import adminRoot from "./modules/admin/admin.root.js";
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import globalMiddelware from './middleware/gobalMiddelware.middleware.js';

const app = express();

//Allowed origin for accessing our server
app.use(corsValidation);


//Allowed some origins to read JS thier responce
app.use(cors(corsOptions));

//Add secure headers
app.use(helmet());
//Middleware for parsing cookie and set theme on request 
app.use(cookieParser());
//Middleware for parsing Json format into readable format (body)
app.use(express.json());


app.use("/auth", authLimiter, authRoot);
app.use(apiLimiter);
app.use("/api/v1/products", productRoot);
app.use("/api/v1/categories", categoriesRoot);
app.use("/api/v1/reviews", reviewRoot);

// Profile photos are referenced by public review responses and loaded by <img> tags,
// which cannot attach the frontend's in-memory bearer token.
app.use("/upload/image", express.static(path.join(process.cwd(), "upload", "image")));

app.use(verifyJwtToken, roleAuthorize(PERMISSION.CUSTOMER, PERMISSION.ADMIN));
app.use("/api/v1/users", userRoot);
app.use("/api/v1/cart", cartRoot);
app.use("/api/v1/whishLists", whiteListRoot);
app.use("/api/v1/orders", orderRoot);
app.use("/api/v1/admin", adminRoot);

//Global err middleware for catching erros
app.use(globalMiddelware);

export default app;
