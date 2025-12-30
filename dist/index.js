"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackHistoryProvider = exports._appListener = exports._emitter = exports.services = exports.AppEvents = void 0;
const node_events_1 = __importDefault(require("node:events"));
const TrackHistoryProvider_1 = __importDefault(require("./provider/TrackHistoryProvider"));
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
const node_process_1 = __importDefault(require("node:process"));
const express_1 = __importStar(require("express"));
const AppListener_1 = __importDefault(require("./class/AppListener"));
const api_1 = __importDefault(require("./route/api"));
const discord_js_1 = require("discord.js");
const axios_1 = require("axios");
(0, dotenv_1.configDotenv)({ quiet: true, path: (0, node_path_1.join)(node_process_1.default.cwd(), ".env") });
var AppEvents;
(function (AppEvents) {
    AppEvents["NewTrack"] = "newTrack";
})(AppEvents || (exports.AppEvents = AppEvents = {}));
let validServices = ["cider", "lastfm", "icecast"];
exports.services = node_process_1.default.env.SERVICES.split(",").map(s => s.toLowerCase().trim()).filter(x => validServices.includes(x));
node_process_1.default.env.SERVICES.split(",").filter(x => x.trim() != "" && !validServices.includes(x.trim())).forEach(invalidServiceListed => {
    console.log(`[WARNING] "${invalidServiceListed}" is not a valid service. valid: ${validServices.join(", ")}`);
});
const config = {
    nowPlayingUpdates: node_process_1.default.argv.includes("-np"),
    richPresenceEnabled: node_process_1.default.argv.includes("-rpc"),
    updateChannel: node_process_1.default.argv.find(x => x.startsWith("-cid="))?.split("-cid=")[1] || null,
};
console.log(`[CONFIGURATION SET]`, config);
const webapp = (0, express_1.default)();
webapp.use((0, express_1.json)());
webapp.use("/api", api_1.default);
exports._emitter = new node_events_1.default();
exports._appListener = new AppListener_1.default(exports.services);
exports.trackHistoryProvider = new TrackHistoryProvider_1.default();
exports._emitter.on(AppEvents.NewTrack, (track) => {
    console.log("[EVENTS] New Track", `(${track.title}${track.artist != null ? ` - ${track.artist}` : ''})${track.album != null ? ` [${track.album}]` : ''}`);
    const res = exports.trackHistoryProvider.recordTrack(track);
    if (!res.data?.success || res.data?.trackId == null) {
        console.log(`[APP] ${exports._appListener.log("Failed to record newly added track")}`);
        return;
    }
    else {
        console.log(`[APP] Updated entry for track ${res.data.trackId}`);
    }
    if (exports._appListener.getDiscordProvider().rpcConfigured) {
        console.log(`[DISCORD] Attempting to set rich presence for new track`);
        const updatedRpc = exports._appListener.getDiscordProvider().updateRPC(track);
        if (!updatedRpc) {
            console.log(`[DISCORD] Failed to set rich presence for new track`);
        }
        else {
            console.log(`[DISCORD] Successfully set rich presence for new track`);
        }
    }
    if (config.nowPlayingUpdates) {
        const channel = exports._appListener.getDiscordProvider().getChannel(config.updateChannel);
        if (channel == null)
            return console.log(`[DISCORD] Could not send a now playing message. Invalid channel provided.`);
        const container = new discord_js_1.ContainerBuilder();
        if (track.imageUrl != null)
            container.addMediaGalleryComponents(new discord_js_1.MediaGalleryBuilder().addItems([{ media: { url: track.imageUrl, width: 512, height: 512 } }]));
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent([`## Now Playing`, "", `${exports._appListener.getDiscordProvider().guildId == "1066284388700135466" ? `<a:RadioSpin:1341207082971693178>` : `💿`} [**${decodeURIComponent(track.title)}** — ${decodeURIComponent(track.artist)}](${track.trackUrl})`].join("\n")));
        channel.send({ flags: [discord_js_1.MessageFlags.IsComponentsV2], components: [container] });
    }
    if (node_process_1.default.env.DUCKY_API_KEY)
        (0, axios_1.post)(`https://ducky.wiki/api/music/tracks/${track.id}`, { ...track, addedTimestamp: track.lastPlayedTimestamp }, { headers: { "apikey": node_process_1.default.env.DUCKY_API_KEY } });
});
exports._appListener.getDiscordProvider().getClient().on(discord_js_1.Events.ClientReady, () => {
    const client = exports._appListener.getDiscordProvider().getClient();
    console.log(`[DISCORD] Client is logged in as ${client.user.username}#${client.user.discriminator}`);
    if (config.nowPlayingUpdates)
        console.log(`[DISCORD] Sending now playing updates to channel ${exports._appListener.getDiscordProvider().getChannel(config.updateChannel)}`);
});
if (config.richPresenceEnabled) {
    exports._appListener.getDiscordProvider().getRPCClient().on("ready", () => {
        console.log(`[DISCORD] Rich Presence initialized`);
    });
}
else {
    console.log(`[DISCORD] Rich presence was not enabled with the -rpc flag. Skipping initialization`);
}
node_process_1.default.on("exit", code => {
    console.log(`[APP] App is shutting down. (${code})`);
});
webapp.listen(node_process_1.default.env.HTTP_PORT, (e) => {
    if (e) {
        console.log(`[APP] Failed to initialize webserver (port ${node_process_1.default.env.HTTP_PORT})`, e);
        node_process_1.default.exit();
    }
    else {
        console.log(`[APP] Webserver initialized (http://localhost:${node_process_1.default.env.HTTP_PORT})`);
    }
});
//# sourceMappingURL=index.js.map