import CiderProvider from "../provider/CiderProvider";
import DiscordProvider from "../provider/DiscordProvider";
import IcecastProvider from "../provider/IcecastProvider";
import LastFMProvider from "../provider/LastFMProvider";

export default class AppListener {
    trackId: string;
    ciderProvider: CiderProvider;
    lastFMProvider: LastFMProvider;
    icecastProvider: IcecastProvider;
    discordProvider: DiscordProvider;
    interval: number;
    fails: number;
    services: string[];

    constructor(services: string[]) {
        this.trackId = null;
        this.fails = 0;

        this.interval = 3e3;
        this.services = services;

        this.ciderProvider = services.includes("cider") ? new CiderProvider("http://localhost:10767", "/api/v1", "/playback/is-playing") : null;
        if (this.ciderProvider === null) console.log(`[APP] Not initializing "Cider" service.`)
        this.lastFMProvider = services.includes("lastfm") ? new LastFMProvider("https://ws.audioscrobbler.com/2.0", "/", "?format=json") : null;
        if (this.lastFMProvider === null) console.log(`[APP] Not initializing "LastFM" service.`)
        this.icecastProvider = services.includes("icecast") ? new IcecastProvider("https://radio.eldentowers.org", "/", "status-json.xsl") : null;
        if (this.icecastProvider === null) console.log(`[APP] Not initializing "Icecast" service.`)

        this.discordProvider = new DiscordProvider();
        this.discordProvider.init();

        this._listener();
    }

    setTrack(id: string): void {
        this.trackId = id;
    }

    getTrack(): string | null {
        return this.trackId;
    }

    getCiderProvider(): CiderProvider {
        return this.ciderProvider;
    }

    getLastFMProvider(): LastFMProvider {
        return this.lastFMProvider;
    }

    getIcecastProvider(): IcecastProvider {
        return this.icecastProvider;
    }

    getDiscordProvider(): DiscordProvider {
        return this.discordProvider;
    }

    log(inp: any): void {
        console.log(`[HEARTBEAT]`, inp);
    }

    _listener() {
        setInterval(() => {


            if (this.services.length <= 0) {
                if (this.fails >= 3) {
                    this.log(`No services enabled. Aborting process. [${this.fails}]`)
                    process.exit();
                }
                this.fails = this.fails + 1;
                this.log(`No services enabled [${this.fails}]`)
                return;
            }
            if (this.trackId == null && (this.fails < 0 || this.fails > 5)) {
                this.log(`No Input`);
                return;
            } else {
                this.fails = this.fails + 1;
            }
            if (this.fails > 10) {
                this.fails = 0;
            }

        }, this.interval)
    }
}