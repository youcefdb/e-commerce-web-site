import dotenv from "dotenv";

dotenv.config();
const {validateEnvironment} = await import("./config/environment.config.js");
validateEnvironment();

const {default: app} = await import("./server.js");
const port = process.env.PORT ?? 3500;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
