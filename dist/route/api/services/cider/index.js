"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const __1 = require("../../../..");
const API_CiderServiceRoute = (0, express_1.Router)();
const API_Cider_PlaybackRoute = (0, express_1.Router)();
API_CiderServiceRoute.use("/playback", API_Cider_PlaybackRoute);
API_Cider_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const ciderProvider = __1._appListener.getCiderProvider();
    const nowPlaying = await ciderProvider.GET("/playback/now-playing");
    res.send(nowPlaying);
});
exports.default = API_CiderServiceRoute;
//# sourceMappingURL=index.js.map