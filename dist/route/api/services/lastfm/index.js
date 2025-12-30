"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const __1 = require("../../../..");
const API_LastFMServiceRoute = (0, express_1.Router)();
const API_LastFM_PlaybackRoute = (0, express_1.Router)();
API_LastFMServiceRoute.use("/playback", API_LastFM_PlaybackRoute);
API_LastFM_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const lastFmProvider = __1._appListener.getLastFMProvider();
    const nowPlaying = await lastFmProvider.GET(`?method=user.getRecentTracks&format=json&user=${lastFmProvider.username}&limit=1&api_key=${lastFmProvider.api_key}`);
    res.send({ data: nowPlaying.data?.recenttracks?.track[0] || null, error: null });
});
exports.default = API_LastFMServiceRoute;
//# sourceMappingURL=index.js.map