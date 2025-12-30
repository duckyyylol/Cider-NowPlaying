"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const AudioServiceProvider_1 = __importDefault(require("./AudioServiceProvider"));
class LastFMProvider extends AudioServiceProvider_1.default {
    constructor(baseUrl, baseEndpoint, statusEndpoint) {
        super(baseUrl, baseEndpoint, statusEndpoint, "lastfm");
        this._scheduler();
        if (!process.env.LASTFM_API_KEY) {
            this.active = false;
            this.api_key = null;
            console.log(`[${this.serviceName.toUpperCase()}] API key is not set`);
        }
        else {
            this.api_key = process.env.LASTFM_API_KEY;
        }
        if (!process.env.LASTFM_USERNAME) {
            this.active = false;
            this.username = null;
            console.log(`[${this.serviceName.toUpperCase()}] Target user is not set`);
        }
        else {
            this.username = process.env.LASTFM_USERNAME;
        }
    }
    async isActive() {
        try {
            const nowPlaying = await this.nowPlaying();
            if (nowPlaying.data === null)
                return false;
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async nowPlaying() {
        if (this.api_key === null)
            return { data: null, error: "Invalid API Key" };
        const res = await this.GET(`?method=user.getRecentTracks&format=json&user=${this.username}&limit=10&api_key=${this.api_key}`);
        if (res.error !== null || res.data === null)
            return res;
        const recentTracks = res.data.recenttracks.track;
        const nowPlaying = recentTracks.find(x => x["@attr"] && x["@attr"]?.nowplaying);
        if (!nowPlaying)
            return { data: null, error: "No track is playing" };
        const trackData = nowPlaying;
        const apiTrack = this.translateTrack(trackData);
        return { data: apiTrack, error: null };
    }
    translateTrack(trackData) {
        const largeImage = trackData?.image.find(x => x.size === "extralarge");
        const apiTrack = {
            id: this.encodeTrackId(trackData?.artist["#text"] || "Nothing", trackData?.name || "Nobody", trackData?.album["#text"] || "Sounds of Nothing"),
            album: trackData?.album["#text"] ? encodeURIComponent(trackData?.album["#text"]) : null,
            artist: trackData?.artist["#text"] ? encodeURIComponent(trackData?.artist["#text"]) : null,
            genres: null,
            title: encodeURIComponent(trackData?.name || "Nothing is Playing"),
            imageUrl: largeImage ? largeImage["#text"] : null,
            trackUrl: trackData?.url || "https://ducky.wiki/trackNotFound",
            lastPlayedTimestamp: Date.now()
        };
        return apiTrack;
    }
    _scheduler() {
        console.log(`[${this.serviceName.toUpperCase()}] Starting ${this.serviceName.toUpperCase()} Scheduler`);
        setInterval(async () => {
            this.active = await this.isActive();
            if (this.active && (__1._appListener.getCiderProvider() != null && await __1._appListener.getCiderProvider().isActive())) {
                console.log(`[${this.serviceName}] Cider is enabled and takes priority over the current service.`);
                return;
            }
            if (!this.active)
                return;
            const nowPlayingResponse = await this.nowPlaying();
            if (nowPlayingResponse.data !== null) {
                const currentTrack = nowPlayingResponse.data;
                if (__1._appListener.getTrack() != currentTrack.id) {
                    __1._appListener.setTrack(currentTrack.id);
                    __1._emitter.emit(__1.AppEvents.NewTrack, currentTrack);
                }
            }
            else {
                console.log(`[${this.serviceName.toUpperCase()}] ${this.serviceName} is enabled but not returning now playing requests.`);
                if (__1.services.length === 1 && __1.services[0] === this.serviceName) {
                    __1._appListener.setTrack(null);
                    __1._emitter.emit(__1.AppEvents.NewTrack, null);
                }
            }
        }, this.interval);
    }
}
exports.default = LastFMProvider;
//# sourceMappingURL=LastFMProvider.js.map