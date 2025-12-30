"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discord_rpc_1 = __importDefault(require("discord-rpc"));
class DiscordProvider {
    constructor() {
        this.ready = true;
        this.rpcConfigured = true;
        this.messageReady = true;
        this.client = new discord_js_1.Client({
            intents: [discord_js_1.IntentsBitField.Flags.MessageContent,
                discord_js_1.IntentsBitField.Flags.Guilds,
                discord_js_1.IntentsBitField.Flags.GuildMembers,
                discord_js_1.IntentsBitField.Flags.GuildMessages,
                discord_js_1.IntentsBitField.Flags.GuildModeration,
                discord_js_1.IntentsBitField.Flags.GuildPresences,
                discord_js_1.IntentsBitField.Flags.GuildInvites,
                discord_js_1.IntentsBitField.Flags.GuildVoiceStates]
        });
        this.rpcClient = new discord_rpc_1.default.Client({ transport: "ipc" });
        this.guildId = process.env.DISCORD_GUILD_ID ? process.env.DISCORD_GUILD_ID : null;
        this.clientId = process.env.DISCORD_CLIENT_ID ? process.env.DISCORD_CLIENT_ID : null;
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET ? process.env.DISCORD_CLIENT_SECRET : null;
        this.token = process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN : null;
        this.largeImageKey = process.env.DISCORD_RPC_LARGE_IMAGE_KEY ? process.env.DISCORD_RPC_LARGE_IMAGE_KEY : null;
        this.largeImageText = process.env.DISCORD_RPC_LARGE_IMAGE_TEXT ? process.env.DISCORD_RPC_LARGE_IMAGE_TEXT : null;
        this.smallImageKey = process.env.DISCORD_RPC_SMALL_IMAGE_KEY ? process.env.DISCORD_RPC_SMALL_IMAGE_KEY : null;
        this.smallImageText = process.env.DISCORD_RPC_SMALL_IMAGE_TEXT ? process.env.DISCORD_RPC_SMALL_IMAGE_TEXT : null;
        if (this.guildId == null) {
            this.messageReady = false;
            console.log(`[DISCORD] Now Playing messages will not send. Please provide a DISCORD_GUILD_ID`);
        }
        if ([this.largeImageKey, this.largeImageText, this.smallImageKey, this.smallImageText].includes(null)) {
            this.rpcConfigured = false;
            console.log(`[DISCORD] Rich presence will not initialize. One or more required values were not provided`);
        }
        if (this.clientId == null) {
            this.ready = false;
            this.rpcConfigured = false;
            console.log(`[DISCORD] Client ID was not provided. Discord integration will not initialize`);
            console.log(`[DISCORD] Client ID was not provided. Rich Presence will not initialize`);
        }
        if (this.clientSecret == null) {
            this.ready = false;
            console.log(`[DISCORD] Client Secret was not provided. Discord integration will not initialize`);
        }
        if (this.token == null) {
            this.ready = false;
            console.log(`[DISCORD] Bot Token was not provided. Discord integration will not initialize`);
        }
    }
    getClient() {
        return this.client;
    }
    getRPCClient() {
        return this.rpcClient;
    }
    getGuild() {
        const guild = this.client.guilds.cache.get(this.guildId);
        if (!guild)
            return null;
        return guild;
    }
    getChannel(channelId) {
        const guild = this.getGuild();
        const channel = guild.channels.cache.get(channelId);
        if (!channel)
            return null;
        if (!channel.isSendable())
            return null;
        return channel;
    }
    async updateRPC(track) {
        const res = await this.rpcClient.setActivity({
            largeImageKey: this.largeImageKey,
            largeImageText: this.largeImageText,
            smallImageKey: this.smallImageKey,
            smallImageText: this.smallImageText,
            startTimestamp: track.lastPlayedTimestamp,
            details: `${decodeURIComponent(track.title)}`,
            state: `${decodeURIComponent(track.artist)}${track.album != null ? ` [${decodeURIComponent(track.album)}]` : ''}`
        });
        if (!res || res == null)
            return false;
        return true;
    }
    init() {
        if (!this.ready) {
            console.log(`[DISCORD] Discord integration did not initialize`);
            return;
        }
        else {
            this.rpcClient.connect(this.clientId);
            this.client.login(this.token);
        }
    }
}
exports.default = DiscordProvider;
//# sourceMappingURL=DiscordProvider.js.map