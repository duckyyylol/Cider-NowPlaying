"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const __1 = require("../../..");
const API_TracksRoute = (0, express_1.Router)();
API_TracksRoute.get("/history", async (req, res) => {
    let response = { data: null, error: "Not Found" };
    if (__1._appListener.getTrack() == null)
        return res.send(response);
    const trackHistoryData = __1.trackHistoryProvider.getData();
    response = { data: trackHistoryData.data, error: null };
    res.send(response);
});
API_TracksRoute.get("/nowplaying", async (req, res) => {
    let response = { data: null, error: "Not Found" };
    if (__1._appListener.getTrack() == null)
        return res.send(response);
    const trackData = __1.trackHistoryProvider.getData(__1._appListener.getTrack());
    response = { data: trackData.data, error: null };
    res.send(response);
});
API_TracksRoute.get("/nowplaying/title", async (req, res) => {
    let response = "Nothing is Playing";
    if (__1._appListener.getTrack() == null)
        return res.send(response);
    const trackData = __1.trackHistoryProvider.getData(__1._appListener.getTrack());
    response = decodeURIComponent(trackData.data.title);
    res.send(response);
});
API_TracksRoute.get("/nowplaying/artist", async (req, res) => {
    let response = "Nobody";
    if (__1._appListener.getTrack() == null)
        return res.send(response);
    const trackData = __1.trackHistoryProvider.getData(__1._appListener.getTrack());
    response = decodeURIComponent(trackData.data.artist);
    res.send(response);
});
exports.default = API_TracksRoute;
//# sourceMappingURL=index.js.map