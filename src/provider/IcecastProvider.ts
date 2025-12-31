import { _appListener, _emitter, AppEvents, services } from "..";
import AudioServiceProvider, { Track, Response, statusError } from "./AudioServiceProvider";

interface IcecastNowPlayingResponse {
    icestats: {
        source?: {
            title: string;
        }
    }
}

export default class IcecastProvider extends AudioServiceProvider {

    constructor(baseUrl: string, baseEndpoint: string, statusEndpoint: string) {
        super(baseUrl, baseEndpoint, statusEndpoint, "icecast");
        this._scheduler();
    }

    async isActive(): Promise<boolean> {
        try {
            const nowPlaying = await this.nowPlaying();
            if(nowPlaying.data === null) return false;
            return true;
        }catch(e) {
            return false;
        }
    }

    async nowPlaying(): Promise<Response<Track | null>> {
        const res = await this.GET(this.statusEndpoint);
        if (res.error !== null || res.data === null) return res;
        const trackData: IcecastNowPlayingResponse = res.data;
        if(!trackData.icestats?.source) return { data: null, error: "Stream Offline" };
        const apiTrack = this.translateTrack(trackData);

        return { data: apiTrack, error: null };
        
    }

    translateTrack(trackData: IcecastNowPlayingResponse): Track {

        const icecastTitleDelim = " _ETr_ "
        const rawTitle = trackData?.icestats?.source?.title || ("Nothing" + icecastTitleDelim + "Nobody");
        const split = rawTitle.split(icecastTitleDelim);
        const title = encodeURIComponent(split[0]) === "Nothing" ? "Nothing is Playing" : encodeURIComponent(split[0])
        const artist = encodeURIComponent(split[1])

        let apiTrack: Track = {
            id: this.encodeTrackId(artist, title, null),
            album: null,
            artist: artist,
            genres: null,
            title: title,
            imageUrl: null,
            trackUrl: "https://ducky.wiki/trackNotFound",
            lastPlayedTimestamp: Date.now(),
            hash: null
        };

        apiTrack.hash = this.makeHash(apiTrack);

        return apiTrack;
    }

    _scheduler() {
        console.log(`[${this.serviceName.toUpperCase()}] Starting ${this.serviceName.toUpperCase()} Scheduler`)
        setInterval(async () => {
            // Activity Check
            this.active = await this.isActive();

            if(this.active && (_appListener.getCiderProvider() != null && await _appListener.getCiderProvider().isActive())) {
                // this.active = false;
                console.log(`[${this.serviceName}] Cider is enabled and takes priority over the current service.`)
                return;
            }

            if(this.active && (_appListener.getLastFMProvider() != null && await _appListener.getLastFMProvider().isActive())) {
                // this.active = false;
                console.log(`[${this.serviceName}] LastFM is enabled and takes priority over the current service.`)
                return;
            }

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