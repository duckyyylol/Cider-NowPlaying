import { _appListener, _emitter, AppEvents, services } from "..";
import AudioServiceProvider, { Track, Response, statusError } from "./AudioServiceProvider";

interface LastFMNowPlayingResponse {
    artist: {
        mbid: string;
        '#text': string;
    };
    streamable: number;
    image: { size: string, '#text': string }[];
    mbid: string;
    album: {
        mbid: string;
        "#text": string;
    }
    name: string;
    url: string;
    date: {
        uts: string;
        "#text": string;
    }
}

export default class LastFMProvider extends AudioServiceProvider {
    api_key: string;
    username: string;

    constructor(baseUrl: string, baseEndpoint: string, statusEndpoint: string) {
        super(baseUrl, baseEndpoint, statusEndpoint, "lastfm");
        this._scheduler();
        if (!process.env.LASTFM_API_KEY) {
            this.active = false;
            this.api_key = null;
            console.log(`[${this.serviceName.toUpperCase()}] API key is not set`)
        } else {
            this.api_key = process.env.LASTFM_API_KEY
        }
        if (!process.env.LASTFM_USERNAME) {
            this.active = false;
            this.username = null;
            console.log(`[${this.serviceName.toUpperCase()}] Target user is not set`)
        } else {
            this.username = process.env.LASTFM_USERNAME
        }
    }

    async isActive(): Promise<boolean> {
        try {
            const nowPlaying = await this.nowPlaying();
            if (nowPlaying.data === null) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    async nowPlaying(): Promise<Response<Track | null>> {
        if (this.api_key === null) return { data: null, error: "Invalid API Key" };
        const res = await this.GET(`?method=user.getRecentTracks&format=json&user=${this.username}&limit=10&api_key=${this.api_key}`)
        if (res.error !== null || res.data === null) return res;
        const recentTracks: any[] = res.data.recenttracks.track;
        const nowPlaying = recentTracks.find(x => x["@attr"] && x["@attr"]?.nowplaying);
        if (!nowPlaying) return { data: null, error: "No track is playing" };
        const trackData: LastFMNowPlayingResponse = nowPlaying;
        const apiTrack = this.translateTrack(trackData);

        return { data: apiTrack, error: null };

    }

    translateTrack(trackData: LastFMNowPlayingResponse): Track {
        const largeImage = trackData?.image.find(x => x.size === "extralarge");

        let apiTrack: Track = {
            id: this.encodeTrackId(trackData?.artist["#text"] || "Nothing", trackData?.name || "Nobody", trackData?.album["#text"] || "Sounds of Nothing"),
            album: trackData?.album["#text"] ? encodeURIComponent(trackData?.album["#text"]) : null,
            artist: trackData?.artist["#text"] ? encodeURIComponent(trackData?.artist["#text"]) : null,
            genres: null,
            title: encodeURIComponent(trackData?.name || "Nothing is Playing"),
            imageUrl: largeImage ? largeImage["#text"] : null,
            trackUrl: trackData?.url || "https://ducky.wiki/trackNotFound",
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

            if (this.active && (_appListener.getCiderProvider() != null && await _appListener.getCiderProvider().isActive())) {
                // this.active = false;
                console.log(`[${this.serviceName}] Cider is enabled and takes priority over the current service.`)
                return;
            }

            if(!this.active) return;


            // Record Playing Tracks
            const nowPlayingResponse = await this.nowPlaying();
            if (nowPlayingResponse.data !== null) {
                const currentTrack: Track = nowPlayingResponse.data;
                // console.log(this.serviceName + "NOW PLAYING", currentTrack)
                if (_appListener.getTrack() != currentTrack.id) {
                    _emitter.emit(AppEvents.NewTrack, currentTrack);
                }
            } else {

                console.log(`[${this.serviceName.toUpperCase()}] ${this.serviceName} is enabled but not returning now playing requests.`)
                if (services.length === 1 && services[0] === this.serviceName) {

                    _appListener.setTrack(null);
                    _emitter.emit(AppEvents.NewTrack, null);
                }
            }
        }, this.interval)
    }

}