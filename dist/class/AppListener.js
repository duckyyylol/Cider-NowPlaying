"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CiderProvider_1 = __importDefault(require("../provider/CiderProvider"));
const DiscordProvider_1 = __importDefault(require("../provider/DiscordProvider"));
const IcecastProvider_1 = __importDefault(require("../provider/IcecastProvider"));
const LastFMProvider_1 = __importDefault(require("../provider/LastFMProvider"));
class AppListener {
    constructor(services) {
        this.trackId = null;
        this.fails = 0;
        this.interval = 3e3;
        this.services = services;
        this.ciderProvider = services.includes("cider") ? new CiderProvider_1.default("http://localhost:10767", "/api/v1", "/playback/is-playing") : null;
        if (this.ciderProvider === null)
            console.log(`[APP] Not initializing "Cider" service.`);
        this.lastFMProvider = services.includes("lastfm") ? new LastFMProvider_1.default("https://ws.audioscrobbler.com/2.0", "/", "?format=json") : null;
        if (this.lastFMProvider === null)
            console.log(`[APP] Not initializing "LastFM" service.`);
        this.icecastProvider = services.includes("icecast") ? new IcecastProvider_1.default("https://radio.eldentowers.org", "/", "status-json.xsl") : null;
        if (this.icecastProvider === null)
            console.log(`[APP] Not initializing "Icecast" service.`);
        this.discordProvider = new DiscordProvider_1.default();
        this.discordProvider.init();
        this._listener();
    }
    setTrack(id) {
        this.trackId = id;
    }
    getTrack() {
        return this.trackId;
    }
    getCiderProvider() {
        return this.ciderProvider;
    }
    getLastFMProvider() {
        return this.lastFMProvider;
    }
    getIcecastProvider() {
        return this.icecastProvider;
    }
    getDiscordProvider() {
        return this.discordProvider;
    }
    log(inp) {
        console.log(`[HEARTBEAT]`, inp);
    }
    _listener() {
        setInterval(() => {
            if (this.services.length <= 0) {
                if (this.fails >= 3) {
                    this.log(`No services enabled. Aborting process. [${this.fails}]`);
                    process.exit();
                }
                this.fails = this.fails + 1;
                this.log(`No services enabled [${this.fails}]`);
                return;
            }
            if (this.trackId == null && (this.fails < 0 || this.fails > 5)) {
                this.log(`No Input`);
                return;
            }
            else {
                this.fails = this.fails + 1;
            }
            if (this.fails > 10) {
                this.fails = 0;
            }
        }, this.interval);
    }
}
exports.default = AppListener;
//# sourceMappingURL=AppListener.js.map