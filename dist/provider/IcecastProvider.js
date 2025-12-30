"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const AudioServiceProvider_1 = __importDefault(require("./AudioServiceProvider"));
class IcecastProvider extends AudioServiceProvider_1.default {
    constructor(baseUrl, baseEndpoint, statusEndpoint) {
        super(baseUrl, baseEndpoint, statusEndpoint, "icecast");
        this._scheduler();
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
        const res = await this.GET(this.statusEndpoint);
        if (res.error !== null || res.data === null)
            return res;
        const trackData = res.data;
        if (!trackData.icestats?.source)
            return { data: null, error: "Stream Offline" };
        const apiTrack = this.translateTrack(trackData);
        return { data: apiTrack, error: null };
    }
    translateTrack(trackData) {
        const icecastTitleDelim = " _ETr_ ";
        const rawTitle = trackData?.icestats?.source?.title || ("Nothing" + icecastTitleDelim + "Nobody");
        const split = rawTitle.split(icecastTitleDelim);
        const title = encodeURIComponent(split[0]) === "Nothing" ? "Nothing is Playing" : encodeURIComponent(split[0]);
        const artist = encodeURIComponent(split[1]);
        const apiTrack = {
            id: this.encodeTrackId(artist, title, "Sounds of Nothing"),
            album: null,
            artist: artist,
            genres: null,
            title: title,
            imageUrl: null,
            trackUrl: "https://ducky.wiki/trackNotFound",
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
            if (this.active && (__1._appListener.getLastFMProvider() != null && await __1._appListener.getLastFMProvider().isActive())) {
                console.log(`[${this.serviceName}] LastFM is enabled and takes priority over the current service.`);
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
exports.default = IcecastProvider;
//# sourceMappingURL=IcecastProvider.js.map