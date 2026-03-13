import EventEmitter from "node:events";
import CiderProvider from "./provider/CiderProvider";
import TrackHistoryProvider from "./provider/TrackHistoryProvider";
import { JSON_StoredTrack, Track } from "./provider/AudioServiceProvider";
import { configDotenv } from "dotenv";
import { join } from "node:path";
import process from "node:process"
import express, { json } from "express";
import AppListener from "./class/AppListener";
import APIRoute from "./route/api";
import { CacheType, ContainerBuilder, Events, Interaction, MediaGalleryBuilder, MessageFlags, PermissionOverwriteManager, TextDisplayBuilder } from "discord.js";
import { post } from "axios";
import OverlayRoute from "./route/overlay";
import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import { CommandBuilder } from "./class/CommandBuilder";
import { Agent } from "node:https";

configDotenv({ quiet: true, path: join(process.cwd(), ".env") })

export enum AppEvents {
    NewTrack = "newTrack"
}

let validServices = ["cider", "lastfm", "icecast"]
export const services = process.env.SERVICES.split(",").map(s => s.toLowerCase().trim()).filter(x => validServices.includes(x));

process.env.SERVICES.split(",").filter(x => x.trim() != "" && !validServices.includes(x.trim())).forEach(invalidServiceListed => {
    console.log(`[WARNING] "${invalidServiceListed}" is not a valid service. valid: ${validServices.join(", ")}`)
})

const config = {
    nowPlayingUpdates: process.argv.includes("-np"),
    richPresenceEnabled: process.argv.includes("-rpc"),
    updateChannel: process.argv.find(x => x.startsWith("-cid="))?.split("-cid=")[1] || null,
}

console.log(`[CONFIGURATION SET]`, config);

const webapp = express();

webapp.use(json());

webapp.use("/public", express.static(join(process.cwd(), "public")))

webapp.use("/api", APIRoute);
webapp.use("/overlay", OverlayRoute);

export const _emitter = new EventEmitter();

export const _appListener = new AppListener(services);

export const trackHistoryProvider = new TrackHistoryProvider();

// WEBSOCKET

let _socketMap: Map<string, WebSocket> = new Map<string, WebSocket>();

interface Packets {
    unauthorized: {
        message: string;
    }
    hello: {};
    heartbeat: {};
    newTrack: Track;
    history: JSON_StoredTrack;
}


type Packet = {
    command: keyof Packets;
    data: any;
    id: number;
};


function _createPacket<T extends keyof Packets>(command: T, data: Packets[T], id: number = 0) {
    return JSON.stringify({ command, data, id });
}

function _broadcast(packet: string) {
    for (let socket of _socketMap.values()) {
        socket.send(packet);
    }
}

export const _socket = new WebSocketServer({ port: parseInt(process.env.WS_PORT) });

_socket.on("connection", (socket: WebSocket) => {
    let heartbeat: NodeJS.Timeout;
    let socketId: string;
    let authorized: boolean = false;

    socket.send(_createPacket("hello", {}));

    socket.onmessage = (async ({ data }) => {
        const packet = JSON.parse(data.toString()) as Packet;
        
        switch (packet.command) {
            case "hello": {
                authorized = true;
                socketId = randomUUID();
                _socketMap.set(socketId, socket);
                console.log(`[WEBSOCKET] Socket ID ${socketId} is now listening to events`)
                heartbeat = setInterval(() => {
                    socket.send(_createPacket("heartbeat", {}));
                }, _appListener.interval)
                break;
            }
            case "newTrack": {
                if (!authorized) {
                    socket.send(_createPacket("unauthorized", { message: "Socket not initialized. You are not authorized to use this endpoint." }))
                    socket.close();
                    return;
                }

                break;
            }
        }
    })

    socket.onclose = (async (s) => {
        _socketMap.delete(socketId);
        console.log(`Socket ${socketId} disconnected`);
        clearInterval(heartbeat);
    })
})



// WEBSOCKET




// APP EVENTS

_emitter.on(AppEvents.NewTrack, (track: Track) => {
    if(track.artist === null || track.title === null) return;
    if(track.title.includes("null") || track.artist.includes("null")) return;
    if(_appListener.getTrack() !== null && track.id === _appListener.getTrack()) return;
    if(track.title !== "Nothing is Playing") _appListener.setTrack(track.id)
    console.log(_appListener.getTrack())
    console.log("[EVENTS] New Track", `(${track.title}${track.artist != null ? ` - ${track.artist}` : ''})${track.album != null ? ` [${track.album}]` : ''}`);

    // WEBSOCKET
        _broadcast(_createPacket("newTrack", track));
    // WEBSOCKET

    const res = trackHistoryProvider.recordTrack(track);
    if (!res.data?.success || res.data?.trackId == null) {
        console.log(`[APP] ${_appListener.log("Failed to record newly added track")}`)
        return;
    } else {
        console.log(`[APP] Updated entry for track ${res.data.trackId}`)
    }

    if (_appListener.getDiscordProvider().rpcConfigured) {
        console.log(`[DISCORD] Attempting to set rich presence for new track`)
        const updatedRpc = _appListener.getDiscordProvider().updateRPC(track);
        if (!updatedRpc) {
            console.log(`[DISCORD] Failed to set rich presence for new track`)

        } else {
            console.log(`[DISCORD] Successfully set rich presence for new track`)

        }
    }

    if (config.nowPlayingUpdates) {
        if(!track.artist) return;
        if(!track.title) return;
        if(track.title === "Nothing is Playing") return;
        const channel = _appListener.getDiscordProvider().getChannel(config.updateChannel);
        if (channel == null) return console.log(`[DISCORD] Could not send a now playing message. Invalid channel provided.`)
        const container = new ContainerBuilder();
        if (track.imageUrl != null) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems([{ media: { url: track.imageUrl, width: 512, height: 512 } }]))
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent([`## Now Playing`, "", `${_appListener.getDiscordProvider().guildId == "1066284388700135466" ? `<a:RadioSpin:1341207082971693178>` : `💿`} [**${decodeURIComponent(track.title)}** — ${decodeURIComponent(track.artist)}](${track.trackUrl})`].join("\n")));

        channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }

    // POST TO DUCKY API
    if (process.env.DUCKY_API_KEY) {
        try {
            post(`https://api.ducky.wiki/music/tracks/${track.id}`, { ...track, addedTimestamp: track.lastPlayedTimestamp }, { headers: { "apikey": process.env.DUCKY_API_KEY }, httpsAgent: new Agent({rejectUnauthorized: false}) }).catch(e => {
                console.log("Couldn't POST to Ducky API", e)
            })
        } catch(e) {
            console.log("Couldn't POST to Ducky API.")
        }
    }

})

// DISCORD EVENTS
_appListener.getDiscordProvider().getClient().on(Events.ClientReady, () => {
    const client = _appListener.getDiscordProvider().getClient();
    _appListener.getDiscordProvider().loadCommands();
    console.log(`[DISCORD] Client is logged in as ${client.user.username}#${client.user.discriminator}`)
    if (config.nowPlayingUpdates) console.log(`[DISCORD] Sending now playing updates to channel ${_appListener.getDiscordProvider().getChannel(config.updateChannel)}`)

})

_appListener.getDiscordProvider().getClient().on(Events.InteractionCreate, async (interaction: Interaction<CacheType>) => {
    if(interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        if(_appListener.getDiscordProvider().getCommandMap().has(commandName)) {
            const command: CommandBuilder = _appListener.getDiscordProvider().getCommandMap().get(commandName);
            let run = command.getRunMethod();
            await run(interaction, _appListener.getDiscordProvider());
        }
    }
})

// RPC EVENTS
if (config.richPresenceEnabled) {
    _appListener.getDiscordProvider().getRPCClient().on("ready", () => {
        console.log(`[DISCORD] Rich Presence initialized`)
    })
} else {
    console.log(`[DISCORD] Rich presence was not enabled with the -rpc flag. Skipping initialization`)
}

// NODE EVENTS

process.on("exit", code => {
    console.log(`[APP] App is shutting down. (${code})`)
})

webapp.listen(process.env.HTTP_PORT, (e) => {
    if (e) {
        console.log(`[APP] Failed to initialize webserver (port ${process.env.HTTP_PORT})`, e)
        process.exit();
    } else {
        console.log(`[APP] Webserver initialized (http://localhost:${process.env.HTTP_PORT})`)
    }
})

