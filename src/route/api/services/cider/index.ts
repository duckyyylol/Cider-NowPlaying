import { Router } from "express";
import { _appListener } from "../../../..";

const API_CiderServiceRoute = Router();

const API_Cider_PlaybackRoute = Router();

API_CiderServiceRoute.use("/playback", API_Cider_PlaybackRoute);

API_Cider_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const ciderProvider = _appListener.getCiderProvider();
    const nowPlaying = await ciderProvider.GET("/playback/now-playing");
    res.send(nowPlaying);
})

export default API_CiderServiceRoute;