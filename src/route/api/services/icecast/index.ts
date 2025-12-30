import { Router } from "express";
import { _appListener } from "../../../..";

const API_IcecastServiceRoute = Router();

const API_Icecast_PlaybackRoute = Router();

API_IcecastServiceRoute.use("/playback", API_Icecast_PlaybackRoute);

API_Icecast_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const ciderProvider = _appListener.getCiderProvider();
    const nowPlaying = await ciderProvider.GET("/playback/now-playing");
    res.send(nowPlaying);
})

export default API_IcecastServiceRoute;