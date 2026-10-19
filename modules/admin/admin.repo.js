//Update status of order
const updateOrderStatus = async (data, ctx) => {
    const query = `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING id;
    `;

    const {rows} = await ctx.db.query(query, [data.status, data.id]);
    return rows[0];
}


export{
    updateOrderStatus
}