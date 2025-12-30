"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cider_1 = __importDefault(require("./cider"));
const lastfm_1 = __importDefault(require("./lastfm"));
const icecast_1 = __importDefault(require("./icecast"));
const API_ServicesRoute = (0, express_1.Router)();
API_ServicesRoute.use("/cider", cider_1.default);
API_ServicesRoute.use("/lastfm", lastfm_1.default);
API_ServicesRoute.use("/icecast", icecast_1.default);
exports.default = API_ServicesRoute;
//# sourceMappingURL=index.js.map