import express from 'express';
import cookieParser from 'cookie-parser';
import verifyJwtToken from './middleware/jwtVerification.middleware.js';
import authRoot from './modules/auth/auth.root.js';
import userRoot from './modules/users/root.users.js';
import productRoot from './modules/products/product.root.js';
import cartRoot from './modules/cart/cart.root.js';
import categoriesRoot from './modules/categories/categories.root.js';
import reviewRoot from './modules/reviews/reviews.root.js';
import whiteListRoot from './modules/wishlist/wishlist.root.js';
import orderRoot from './modules/orders/orders.root.js';

const app = express();

//Middleware for reading cookie and set theme on request
app.use(cookieParser());
//Middleware for parsing Json format into readable format (body)
app.use(express.json());


app.use("/auth", authRoot);
app.use("/product", productRoot);

app.use(verifyJwtToken);

app.use("/users", userRoot);
app.use("/categories", categoriesRoot);
app.use("/cart", cartRoot);
app.use("/reviews", reviewRoot);
app.use("/whishList", whiteListRoot);
app.use("/orders", orderRoot);


export default app;