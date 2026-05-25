import dotenv from "dotenv";
import app from "./server.js";

dotenv.config();
const port = process.env.PORT ?? 3500;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})