import conn from "../../config/db.config.js";

const getAdminStats = async (ctx = {db: conn}) => {
    const totalsQuery = `
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_users,
            (SELECT COUNT(*) FROM orders) AS total_orders,
            (SELECT COUNT(*) FROM products) AS total_products,
            COALESCE((
                SELECT SUM(total_price)
                FROM orders
                WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
            ), 0) AS total_sales
    `;

    const salesOverTimeQuery = `
        WITH dates AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            )::date AS day
        ), daily_sales AS (
            SELECT created_at::date AS day, SUM(total_price) AS sales
            FROM orders
            WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
                AND created_at >= CURRENT_DATE - INTERVAL '6 days'
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
            GROUP BY created_at::date
        )
        SELECT TO_CHAR(dates.day, 'YYYY-MM-DD') AS date,
            COALESCE(daily_sales.sales, 0) AS sales
        FROM dates
        LEFT JOIN daily_sales ON daily_sales.day = dates.day
        ORDER BY dates.day
    `;

    const categorySalesQuery = `
        SELECT c.name, SUM(oi.price * oi.quantity) AS value
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
        GROUP BY c.id, c.name
        ORDER BY value DESC, c.name ASC
    `;

    const [totalsResult, salesResult, categoryResult] = await Promise.all([
        ctx.db.query(totalsQuery),
        ctx.db.query(salesOverTimeQuery),
        ctx.db.query(categorySalesQuery)
    ]);
    const totals = totalsResult.rows[0];

    return {
        totalSales: Number(totals.total_sales),
        totalOrders: Number(totals.total_orders),
        totalProducts: Number(totals.total_products),
        totalUsers: Number(totals.total_users),
        salesOverTime: salesResult.rows.map((day) => ({
            date: day.date,
            sales: Number(day.sales)
        })),
        categorySales: categoryResult.rows.map((category) => ({
            name: category.name,
            value: Number(category.value)
        }))
    };
};

const getAdminOrders = async (ctx = {db: conn}) => {
    const query = `
        SELECT o.id,
            o.user_id AS "userId",
            o.total_price AS total,
            o.status,
            o.shipping_address AS "shippingAddress",
            o.payment_method AS "paymentMethod",
            o.created_at AS "createdAt",
            COALESCE(
                json_agg(json_build_object(
                    'id', oi.id,
                    'productId', oi.product_id,
                    'name', p.name,
                    'price', oi.price,
                    'image', COALESCE(p.image, ''),
                    'quantity', oi.quantity
                )) FILTER (WHERE oi.id IS NOT NULL),
                '[]'::json
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        GROUP BY o.id
        ORDER BY o.created_at DESC, o.id DESC
    `;

    const {rows} = await ctx.db.query(query);
    return rows.map((order) => {
        const address = order.shippingAddress ?? {};
        return {
            ...order,
            total: Number(order.total),
            shippingAddress: {
                name: address.fullName ?? address.name ?? "",
                address: address.address ?? "",
                city: address.city ?? "",
                postalCode: address.postal_code ?? address.postalCode ?? "",
                country: address.country ?? ""
            },
            items: order.items.map((item) => ({
                ...item,
                price: Number(item.price),
                quantity: Number(item.quantity)
            }))
        };
    });
};

const getAdminUsers = async (ctx = {db: conn}) => {
    const query = `
        SELECT id, name, email, role, avatar, created_at AS "createdAt"
        FROM users
        ORDER BY created_at DESC, id DESC
    `;

    const {rows} = await ctx.db.query(query);
    return rows;
};

//Update status of order
const findOrderForUpdate = async (id, ctx) => {
    const query = `
        SELECT id, status
        FROM orders
        WHERE id = $1
        FOR UPDATE
    `;

    const {rows} = await ctx.db.query(query, [id]);
    return rows[0];
}

const updateOrderStatus = async (data, ctx) => {
    const query = `
        UPDATE orders
        SET status = $1
        WHERE id = $2
            AND status = $3
        RETURNING id, status;
    `;

    const {rows} = await ctx.db.query(query, [data.status, data.id, data.currentStatus]);
    return rows[0];
}


export{
    getAdminStats,
    getAdminOrders,
    getAdminUsers,
    findOrderForUpdate,
    updateOrderStatus
}
