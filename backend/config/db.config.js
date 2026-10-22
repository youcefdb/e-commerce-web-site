import {Pool} from "pg";
import dotenv from "dotenv";

dotenv.config();

const conn = new Pool({
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
    host: process.env.DATABASE_HOST
});

export default conn;