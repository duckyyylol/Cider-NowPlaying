"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const __1 = require("../../../..");
const API_IcecastServiceRoute = (0, express_1.Router)();
const API_Icecast_PlaybackRoute = (0, express_1.Router)();
API_IcecastServiceRoute.use("/playback", API_Icecast_PlaybackRoute);
API_Icecast_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const ciderProvider = __1._appListener.getCiderProvider();
    const nowPlaying = await ciderProvider.GET("/playback/now-playing");
    res.send(nowPlaying);
});
exports.default = API_IcecastServiceRoute;
//# sourceMappingURL=index.js.map