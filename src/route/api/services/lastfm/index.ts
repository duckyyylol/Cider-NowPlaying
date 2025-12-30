import { Router } from "express";
import { _appListener } from "../../../..";

const API_LastFMServiceRoute = Router();

const API_LastFM_PlaybackRoute = Router();

API_LastFMServiceRoute.use("/playback", API_LastFM_PlaybackRoute);

API_LastFM_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const lastFmProvider = _appListener.getLastFMProvider();
    const nowPlaying = await lastFmProvider.GET(`?method=user.getRecentTracks&format=json&user=${lastFmProvider.username}&limit=1&api_key=${lastFmProvider.api_key}`);
    res.send({data: nowPlaying.data?.recenttracks?.track[0] || null, error: null});
})

export default API_LastFMServiceRoute;