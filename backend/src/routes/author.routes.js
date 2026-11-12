"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const author_controller_1 = require("../controllers/author.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const params_schema_1 = require("../schemas/params.schema");
const router = (0, express_1.Router)();
// Public route (read-only)
router.get('/:authorName', (0, validate_middleware_1.validateParams)(params_schema_1.authorNameParamSchema), author_controller_1.getAuthorByName);
exports.default = router;
