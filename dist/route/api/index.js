"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tracks_1 = __importDefault(require("./tracks"));
const services_1 = __importDefault(require("./services"));
const APIRoute = (0, express_1.Router)();
APIRoute.use("/tracks", tracks_1.default);
APIRoute.use("/services", services_1.default);
exports.default = APIRoute;
//# sourceMappingURL=index.js.map