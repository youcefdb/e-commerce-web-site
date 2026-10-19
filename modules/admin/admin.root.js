import express from express;
import PERMISSION from "../../config/roles.config.js";
import roleAuthorize from "../../middleware/roleCheck.middleware.js";
import schemaValidator from "../../middleware/schemaValidator.middleware.js";
import * as adminController from "../admin/admin.controller.js";
import * as adminSchema from "../admin/admin.validation.js";
const adminRoot = express.Router();

adminRoot
    .patch(
        roleAuthorize(PERMISSION.ADMIN),
        schemaValidator(adminSchema.updateOrderStatusSchema),
        adminController.updateOrderStatus
    );


export default adminRoot;