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
        if (res.error !== null || res.data === null) return res;
        const trackData: CiderNowPlayingResponse = res.data;
        if (trackData?.status !== "ok") return { data: null, error: "Not Found" };
        const apiTrack = this.translateTrack(trackData);

        return { data: apiTrack, error: null };
    }

    translateTrack(trackData: CiderNowPlayingResponse): Track {
        const apiTrack: Track = {
            id: this.encodeTrackId(trackData.info?.artistName || "Nothing", trackData.info?.name || "Nobody", trackData.info.albumName || "Sounds of Nothing"),
            album: encodeURIComponent(trackData.info?.albumName || null),
            artist: encodeURIComponent(trackData.info?.artistName || null), 
            title: encodeURIComponent(trackData.info?.name || "Nothing is Playing"),
            imageUrl: trackData.info?.artwork?.url || "https://ducky.wiki/public/img/ducky.png",
            lastPlayedTimestamp: Date.now(),
            trackUrl: trackData.info?.url || "https://ducky.wiki/trackNotFound",
            genres: trackData.info?.genreNames?.length > 0 ? trackData.info.genreNames.map(x => encodeURIComponent(x)) : null,
        }

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
            if (nowPlayingResponse.data !== null) {
                const currentTrack: Track = nowPlayingResponse.data;
                // console.log(this.serviceName + "NOW PLAYING", currentTrack)
                if (_appListener.getTrack() != currentTrack.id) { 
                    _appListener.setTrack(currentTrack.id); 
                    _emitter.emit(AppEvents.NewTrack, currentTrack);
                }
            } else {
                console.log(`[${this.serviceName.toUpperCase()}] ${this.serviceName} is enabled but not returning now playing requests.`)
                if(services.length === 1 && services[0] === this.serviceName) {
                    _appListener.setTrack(null); 
                    _emitter.emit(AppEvents.NewTrack, null);
                }
            }
        }, this.interval)
    }

}