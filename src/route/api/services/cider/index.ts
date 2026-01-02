import { Router } from "express";
import { _appListener } from "../../../..";
import { Response } from "../../../../provider/AudioServiceProvider"

export interface Cider_IsPlayingResponse {
    playing: boolean;
    paused: boolean;
}

export interface Cider_VolumeResponse {
    volume: number;
    old_volume?: number;
}

export interface Cider_TrackPlayedResponse {
    added: boolean;
    song: any | null;
}

const API_CiderServiceRoute = Router();

API_CiderServiceRoute.get("/test", async (req,res) => {
    if(!req.body || !req.body?.path) return res.sendStatus(400);

    const ciderProvider = _appListener.getCiderProvider();
    // const response = await ciderProvider.POST("/amapi/run-v3", JSON.stringify({path: req.body.path}));

    res.send(await ciderProvider.getStorefront());
})

const API_Cider_PlaybackRoute = Router();

API_CiderServiceRoute.use("/playback", API_Cider_PlaybackRoute);

API_Cider_PlaybackRoute.get("/status", async (req, res) => {
    let playing = true;
    let paused = false;

    const ciderProvider = _appListener.getCiderProvider();
    const playingResponse = await ciderProvider.GET("/playback/is-playing");
    if (playingResponse.data == null) playing = false;
    if (!playingResponse?.data?.is_playing) playing = false;
    if (!playing) {
        const activeResponse = await ciderProvider.GET("/playback/active");
        if (activeResponse.data === null || activeResponse.error !== null) {
            paused = false;
        } else {
            paused = true;
        }
    }

    res.send({ data: { playing, paused }, error: null } as Response<Cider_IsPlayingResponse>);
})

API_Cider_PlaybackRoute.get("/volume", async (req, res) => {
    const ciderProvider = _appListener.getCiderProvider();
    const volumeResponse = await ciderProvider.GET("/playback/volume");
    if(volumeResponse.data === null || !volumeResponse.data?.volume || volumeResponse.error !== null) return res.send({data: null, error: "Not Found"} as Response<null>)
    res.send({data: {volume: volumeResponse.data.volume}, error: null} as Response<Cider_VolumeResponse>)
})

API_Cider_PlaybackRoute.post("/skip", async (req, res) => {
    if(!req.headers.quack || req.headers?.quack !== "quack") return res.send({error: "Unauthorized", data: null});

    const ciderProvider = _appListener.getCiderProvider();
    const skipResponse = await ciderProvider.POST("/playback/next");

    if(skipResponse.data === null || skipResponse.error !== null) return res.send({data: false, error: skipResponse.error} as Response<boolean>);

    res.send({data: true, error: null} as Response<boolean>)
})

API_Cider_PlaybackRoute.post("/previous", async (req, res) => {
    if(!req.headers.quack || req.headers?.quack !== "quack") return res.send({error: "Unauthorized", data: null});

    const ciderProvider = _appListener.getCiderProvider();
    const previousSongResponse = await ciderProvider.POST("/playback/previous");

    if(previousSongResponse.data === null || previousSongResponse.error !== null) return res.send({data: false, error: previousSongResponse.error} as Response<boolean>);

    res.send({data: true, error: null} as Response<boolean>)
})

API_Cider_PlaybackRoute.post("/pause", async (req, res) => {
    if(!req.headers.quack || req.headers?.quack !== "quack") return res.send({error: "Unauthorized", data: null});

    const ciderProvider = _appListener.getCiderProvider();
    const pauseResponse = await ciderProvider.POST("/playback/pause");

    if(pauseResponse.data === null || pauseResponse.error !== null) return res.send({data: false, error: pauseResponse.error} as Response<boolean>);

    res.send({data: true, error: null} as Response<boolean>)
})

API_Cider_PlaybackRoute.post("/play", async (req, res) => {
    if(!req.headers.quack || req.headers?.quack !== "quack") return res.send({error: "Unauthorized", data: null});

    const ciderProvider = _appListener.getCiderProvider();
    const playResponse = await ciderProvider.POST("/playback/play");

    if(playResponse.data === null || playResponse.error !== null) return res.send({data: false, error: playResponse.error} as Response<boolean>);

    res.send({data: true, error: null} as Response<boolean>)
})

API_Cider_PlaybackRoute.post("/play/:songId", async (req, res) => {
    if(!req.headers.quack || req.headers?.quack !== "quack") return res.send({error: "Unauthorized", data: null});

    const ciderProvider = _appListener.getCiderProvider();
    const playResponse = await ciderProvider.POST("/playback/play-next", JSON.stringify({type: "songs", id: req.params.songId}));

    if(playResponse.data === null || playResponse.error !== null) return res.send({data: {added: false, song: null}, error: playResponse.error} as Response<Cider_TrackPlayedResponse>);

    const playedSongSearch = await ciderProvider.getTrackById(req.params.songId);
    if(playedSongSearch.error !== null || playedSongSearch.data === null) return res.send({data: {added: true, song: null}, error: null} as Response<Cider_TrackPlayedResponse>)

    res.send({data: {added: true, song: playedSongSearch.data}, error: null} as Response<Cider_TrackPlayedResponse>)
})

API_Cider_PlaybackRoute.post("/volume", async (req, res) => {
    if(!req.headers.quack || req.headers?.quack !== "quack") return res.send({error: "Unauthorized", data: null})
    if(!req.body || req.body.volume < 0) return res.send({error: "Invalid Body", data: null})
    const desiredVolume = req.body.volume;
    if(desiredVolume < 0) return res.send({error: "Can not set volume to a negative", data: null})
    if(Math.floor(desiredVolume) > 1) return res.send({error: "Volume is a range 0-1", data: null})

    const ciderProvider = _appListener.getCiderProvider();
    const currentVolumeResponse = await ciderProvider.GET("/playback/volume");
    if(currentVolumeResponse.data === null || (currentVolumeResponse.data?.volume < 0) || currentVolumeResponse.error !== null) return res.send({data: null, error: "Service is not active"} as Response<null>)
    
    const currentVolume = currentVolumeResponse.data.volume;

    if(currentVolume === desiredVolume) return res.send({error: null, data: {volume: currentVolume}} as Response<Cider_VolumeResponse>);

    const setVolumeResponse = await ciderProvider.POST("/playback/volume", {volume: desiredVolume});
    if(setVolumeResponse.error !== null) return res.send({error: "Could not POST", data: null});
    
    res.send({error: null, data: {volume: desiredVolume, old_volume: currentVolume}} as Response<Cider_VolumeResponse>);
})

API_Cider_PlaybackRoute.get("/nowplaying", async (req, res) => {
    const ciderProvider = _appListener.getCiderProvider();
    const nowPlaying = await ciderProvider.GET("/playback/now-playing");

    res.send(nowPlaying);
})

export default API_CiderServiceRoute;