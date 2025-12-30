import { Router } from "express";
import { Track, Response, JSON_StoredTrack } from "../../../provider/AudioServiceProvider";
import { _appListener, trackHistoryProvider } from "../../..";

const API_TracksRoute = Router();

API_TracksRoute.get("/history", async (req, res) => {
    let response: Response<JSON_StoredTrack | null> = {data: null, error: "Not Found"};
    if(_appListener.getTrack() == null) return res.send(response);
    const trackHistoryData = trackHistoryProvider.getData();

    response = {data: trackHistoryData.data as (JSON_StoredTrack | null), error: null};

    res.send(response);
})

API_TracksRoute.get("/nowplaying", async (req, res) => {
    let response: Response<Track | null> = {data: null, error: "Not Found"};
    if(_appListener.getTrack() == null) return res.send(response);
    const trackData = trackHistoryProvider.getData(_appListener.getTrack());

    response = {data: trackData.data as (Track | null), error: null};
    
    res.send(response);
})

API_TracksRoute.get("/nowplaying/title", async (req, res) => {
    let response: string = "Nothing is Playing"
    if(_appListener.getTrack() == null) return res.send(response);
    const trackData = trackHistoryProvider.getData(_appListener.getTrack());

    response = decodeURIComponent(trackData.data.title as string);
    
    res.send(response);
})

API_TracksRoute.get("/nowplaying/artist", async (req, res) => {
    let response: string = "Nobody"
    if(_appListener.getTrack() == null) return res.send(response);
    const trackData = trackHistoryProvider.getData(_appListener.getTrack());

    response = decodeURIComponent(trackData.data.artist as string);
    
    res.send(response);
})

export default API_TracksRoute;