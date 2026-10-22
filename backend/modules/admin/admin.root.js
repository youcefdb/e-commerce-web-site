import express from "express";
import PERMISSION from "../../config/roles.config.js";
import roleAuthorize from "../../middleware/roleCheck.middleware.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import idempotencyKey from "../../middleware/idempotencyKey,middleware.js";
import * as adminController from "../admin/admin.controller.js";
import * as adminSchema from "../admin/admin.validation.js";
const adminRoot = express.Router();

adminRoot
    .get("/stats",
        roleAuthorize(PERMISSION.ADMIN),
        schemaValidator({query: adminSchema.adminListQuerySchema}),
        adminController.getStats
    )
    .get("/orders",
        roleAuthorize(PERMISSION.ADMIN),
        schemaValidator({query: adminSchema.adminListQuerySchema}),
        adminController.getOrders
    )
    .get("/users",
        roleAuthorize(PERMISSION.ADMIN),
        schemaValidator({query: adminSchema.adminListQuerySchema}),
        adminController.getUsers
    )
    .patch("/orders/:id",
        roleAuthorize(PERMISSION.ADMIN),
        schemaValidator({
            params: adminSchema.updateOrderStatusParamsSchema,
            body: adminSchema.updateOrderStatusBodySchema
        }),
        idempotencyKey,
        adminController.updateOrderStatus
    );


export default adminRoot;
