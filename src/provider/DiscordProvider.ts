import { Client, Guild, GuildBasedChannel, GuildChannel, IntentsBitField, SendableChannels, TextBasedChannel } from "discord.js";
import RPC from "discord-rpc"
import { Track } from "./AudioServiceProvider";

export default class DiscordProvider {
    client: Client;
    rpcClient: RPC.Client;

    guildId: string;

    clientId: string;
    clientSecret: string;
    token: string;

    largeImageKey: string;
    largeImageText: string;
    smallImageKey: string;
    smallImageText: string;

    ready: boolean;
    rpcConfigured: boolean;
    messageReady: boolean;

    constructor() {
        this.ready = true;
        this.rpcConfigured = true;
        this.messageReady = true;

        this.client = new Client({
            intents: [IntentsBitField.Flags.MessageContent,
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.GuildModeration,
            IntentsBitField.Flags.GuildPresences,
            IntentsBitField.Flags.GuildInvites,
            IntentsBitField.Flags.GuildVoiceStates]
        });

        this.rpcClient = new RPC.Client({transport: "ipc"});

        this.guildId = process.env.DISCORD_GUILD_ID ? process.env.DISCORD_GUILD_ID : null;

        this.clientId = process.env.DISCORD_CLIENT_ID ? process.env.DISCORD_CLIENT_ID : null;
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET ? process.env.DISCORD_CLIENT_SECRET : null;
        this.token = process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN : null;

        this.largeImageKey = process.env.DISCORD_RPC_LARGE_IMAGE_KEY ? process.env.DISCORD_RPC_LARGE_IMAGE_KEY : null;
        this.largeImageText = process.env.DISCORD_RPC_LARGE_IMAGE_TEXT ? process.env.DISCORD_RPC_LARGE_IMAGE_TEXT : null;

        this.smallImageKey = process.env.DISCORD_RPC_SMALL_IMAGE_KEY ? process.env.DISCORD_RPC_SMALL_IMAGE_KEY : null;
        this.smallImageText = process.env.DISCORD_RPC_SMALL_IMAGE_TEXT ? process.env.DISCORD_RPC_SMALL_IMAGE_TEXT : null;

        if(this.guildId == null) {
            this.messageReady = false;
            console.log(`[DISCORD] Now Playing messages will not send. Please provide a DISCORD_GUILD_ID`)
        }

        if([this.largeImageKey, this.largeImageText, this.smallImageKey, this.smallImageText].includes(null)) {
            this.rpcConfigured = false;
            console.log(`[DISCORD] Rich presence will not initialize. One or more required values were not provided`)
        }

        if(this.clientId == null) {
            this.ready = false;
            this.rpcConfigured = false;
            console.log(`[DISCORD] Client ID was not provided. Discord integration will not initialize`)
            console.log(`[DISCORD] Client ID was not provided. Rich Presence will not initialize`)
        }
        if(this.clientSecret == null) {
            this.ready = false;
            console.log(`[DISCORD] Client Secret was not provided. Discord integration will not initialize`)
        }
        if(this.token == null) {
            this.ready = false;
            console.log(`[DISCORD] Bot Token was not provided. Discord integration will not initialize`)
        }

    }

    getClient(): Client {
        return this.client;
    }

    getRPCClient(): RPC.Client {
        return this.rpcClient;
    }

    getGuild(): Guild {
        const guild = this.client.guilds.cache.get(this.guildId);
        if(!guild) return null;
        return guild;
    }

    getChannel(channelId: string): SendableChannels {
        const guild = this.getGuild();
        const channel = guild.channels.cache.get(channelId);
        if(!channel) return null;
        if(!channel.isSendable()) return null;
        return channel;
    }

    async updateRPC(track: Track): Promise<boolean> {
        const res = await this.rpcClient.setActivity({
            largeImageKey: this.largeImageKey,
            largeImageText: this.largeImageText,
            smallImageKey: this.smallImageKey,
            smallImageText: this.smallImageText,
            startTimestamp: track.lastPlayedTimestamp,
            details: `${decodeURIComponent(track.title)}`,
            state: `${decodeURIComponent(track.artist)}${track.album != null ? ` [${decodeURIComponent(track.album)}]` : ''}`
            
        })

        if(!res || res == null) return false;
        return true;
    }

    init(): void {
        if(!this.ready) {
            console.log(`[DISCORD] Discord integration did not initialize`)
            return;
        } else {
            this.rpcClient.connect(this.clientId);
            this.client.login(this.token);
        }
    }
}