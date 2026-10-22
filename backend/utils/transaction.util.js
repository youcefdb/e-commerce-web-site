import conn from "../config/db.config.js"

const withTransaction = async (callback) => {
    const client = await conn.connect();
    try {
        await client.query("BEGIN");// Start transaction
        const result = await callback(client);
        await client.query("COMMIT"); //Save changes
        return result;
    } catch (error) {
        await client.query("ROLLBACK")
        throw error;
    } finally{
        client.release(); //realease client so another transaction can start
    }
}

export default withTransaction;