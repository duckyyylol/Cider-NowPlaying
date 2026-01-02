import { _appListener, _emitter, AppEvents, services } from "..";
import AudioServiceProvider, { Track, Response, statusError } from "./AudioServiceProvider";

interface CiderNowPlayingResponse {
    status: string;
    info: {
        albumName: string;
        artistName: string;
        artwork: {
            width: number;
            height: number;
            url: string;
        };
        audioLocale: string;
        audioTraits: string[];
        composerName: string;
        discNumber: number;
        durationInMillis: number;
        genreNames: string[];
        hasLyrics: boolean;
        hasTimeSyncedLyrics: boolean;
        isAppleDigitalMaster: boolean;
        isMasteredForItunes: boolean;
        isVocalAttenuationAllowed: boolean;
        isrc: string;
        name: string;
        playParams: {
            id: string;
            kind: string;
        };
        previews: { url: string }[];
        releaseDate: string;
        trackNumber: number;
        url: string;
        currentPlaybackTime: number;
        remainingTime: number;
        inFavorites: boolean;
        inLibrary: boolean;
        shuffleMode: boolean;
        repeatMode: boolean;
    }
}

export default class CiderProvider extends AudioServiceProvider {

    constructor(baseUrl: string, baseEndpoint: string, statusEndpoint: string) {
        super(baseUrl, baseEndpoint, statusEndpoint, "cider");
        this._scheduler();
    }

    async isActive(): Promise<boolean> {
        const res = await this.GET(this.statusEndpoint);
        if (res.error !== null) return false;
        if (res.data === null) return false;
        if (res.data?.status !== "ok") return false;
        return res.data?.is_playing;
    }

    async nowPlaying(): Promise<Response<Track | null>> {
        const res = await this.GET("/playback/now-playing")
        if (res.error !== null && res.data === null) return {error: "Not Found", data: null};
        const trackData: CiderNowPlayingResponse = res.data;
        if (trackData?.status !== "ok") return { data: null, error: "Not Found" };
        const apiTrack = this.translateTrack(trackData);

        return { data: apiTrack, error: null };
    }

    async getStorefront(): Promise<Response<string>> {
        const amApiResonse = await this.POST("/amapi/run-v3", JSON.stringify({path: "/v1/me/storefront"}));
        if(amApiResonse.error !== null || amApiResonse.data === null || !amApiResonse.data?.data) return {error: "Not Found", data: null};
        const {data: realResponse} = amApiResonse.data;
        if(!realResponse?.data || !realResponse?.data?.[0]?.id) return {error: "Not Found", data: null};
        const storefrontId = realResponse.data[0].id;

        return {data: storefrontId, error: null};
    }

    async getTrackById(appleMusicId: string) {
        const storefrontResponse = await this.getStorefront();
        if(storefrontResponse.error !== null) return {data: null, error: "Not Found"};

        const amApiSongResponse = await this.POST("/amapi/run-v3", JSON.stringify({path: `/v1/catalog/${storefrontResponse.data}/songs/${appleMusicId}`}));
        if(amApiSongResponse.error !== null || amApiSongResponse.data === null || !amApiSongResponse.data?.data) return {data: null, error: "Not Found"};

        const {data: realResponse} = amApiSongResponse.data;
        if(!realResponse?.data || !realResponse?.data?.[0]?.id) return {error: "Not Found", data: null};

        return {data: realResponse, error: null};
    }

    translateTrack(trackData: CiderNowPlayingResponse): Track {
        let apiTrack: Track = {
            hash: null,
            id: this.encodeTrackId(trackData.info?.artistName || null, trackData.info?.name || "Nothing is Playing", trackData.info?.albumName || null),
            album: encodeURIComponent(trackData.info?.albumName || null),
            artist: encodeURIComponent(trackData.info?.artistName || null), 
            title: encodeURIComponent(trackData.info?.name || null),
            imageUrl: trackData.info?.artwork?.url || null,
            lastPlayedTimestamp: Date.now(),
            trackUrl: trackData.info?.url || "https://ducky.wiki/trackNotFound",
            genres: trackData.info?.genreNames?.length > 0 ? trackData.info.genreNames.map(x => encodeURIComponent(x)) : null,
            provider: this.serviceName as any,
            has_controls: true
        }

        apiTrack.hash = this.makeHash(apiTrack);

        return apiTrack;
    }

    _scheduler() {
        console.log(`[${this.serviceName.toUpperCase()}] Starting ${this.serviceName.toUpperCase()} Scheduler`)
        setInterval(async () => {
            // Activity Check
            this.active = await this.isActive();

            if(!this.active) return;


            // Record Playing Tracks
            const nowPlayingResponse = await this.nowPlaying();
            if (nowPlayingResponse.data !== null && nowPlayingResponse.data.artist !== null) {
                const currentTrack: Track = nowPlayingResponse.data;
                // console.log(this.serviceName + "NOW PLAYING", currentTrack)
                if (_appListener.getTrack() != currentTrack.id) { 
                    _emitter.emit(AppEvents.NewTrack, currentTrack);
                }
            } else {
                console.log(`[${this.serviceName.toUpperCase()}] ${this.serviceName} is enabled but not returning now playing requests.`)
                // if(services.length === 1 && services[0] === this.serviceName) {
                //     _appListener.setTrack(null); 
                //     _emitter.emit(AppEvents.NewTrack, null);
                // }
            }
        }, this.interval)
    }

}