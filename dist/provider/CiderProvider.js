"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const AudioServiceProvider_1 = __importDefault(require("./AudioServiceProvider"));
class CiderProvider extends AudioServiceProvider_1.default {
    constructor(baseUrl, baseEndpoint, statusEndpoint) {
        super(baseUrl, baseEndpoint, statusEndpoint, "cider");
        this._scheduler();
    }
    async isActive() {
        const res = await this.GET(this.statusEndpoint);
        if (res.error !== null)
            return false;
        if (res.data === null)
            return false;
        if (res.data?.status !== "ok")
            return false;
        return res.data?.is_playing;
    }
    async nowPlaying() {
        const res = await this.GET("/playback/now-playing");
        if (res.error !== null || res.data === null)
            return res;
        const trackData = res.data;
        if (trackData?.status !== "ok")
            return { data: null, error: "Not Found" };
        const apiTrack = this.translateTrack(trackData);
        return { data: apiTrack, error: null };
    }
    translateTrack(trackData) {
        const apiTrack = {
            id: this.encodeTrackId(trackData.info?.artistName || "Nothing", trackData.info?.name || "Nobody", trackData.info.albumName || "Sounds of Nothing"),
            album: encodeURIComponent(trackData.info?.albumName || null),
            artist: encodeURIComponent(trackData.info?.artistName || null),
            title: encodeURIComponent(trackData.info?.name || "Nothing is Playing"),
            imageUrl: trackData.info?.artwork?.url || "https://ducky.wiki/public/img/ducky.png",
            lastPlayedTimestamp: Date.now(),
            trackUrl: trackData.info?.url || "https://ducky.wiki/trackNotFound",
            genres: trackData.info?.genreNames?.length > 0 ? trackData.info.genreNames.map(x => encodeURIComponent(x)) : null,
        };
        return apiTrack;
    }
    _scheduler() {
        console.log(`[${this.serviceName.toUpperCase()}] Starting ${this.serviceName.toUpperCase()} Scheduler`);
        setInterval(async () => {
            this.active = await this.isActive();
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
exports.default = CiderProvider;
//# sourceMappingURL=CiderProvider.js.map