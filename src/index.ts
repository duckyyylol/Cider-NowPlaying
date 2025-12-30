import EventEmitter from "node:events";
import CiderProvider from "./provider/CiderProvider";
import TrackHistoryProvider from "./provider/TrackHistoryProvider";
import { Track } from "./provider/AudioServiceProvider";
import { configDotenv } from "dotenv";
import { join } from "node:path";
import process from "node:process"
import express, { json } from "express";
import AppListener from "./class/AppListener";
import APIRoute from "./route/api";
import { ContainerBuilder, Events, MediaGalleryBuilder, MessageFlags, PermissionOverwriteManager, TextDisplayBuilder } from "discord.js";
import { post } from "axios";

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
webapp.use("/api", APIRoute);

export const _emitter = new EventEmitter();

export const _appListener = new AppListener(services);

export const trackHistoryProvider = new TrackHistoryProvider();


// APP EVENTS

_emitter.on(AppEvents.NewTrack, (track: Track) => {
    console.log("[EVENTS] New Track", `(${track.title}${track.artist != null ? ` - ${track.artist}` : ''})${track.album != null ? ` [${track.album}]` : ''}`);
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

    if(config.nowPlayingUpdates) {
        const channel = _appListener.getDiscordProvider().getChannel(config.updateChannel);
        if(channel == null) return console.log(`[DISCORD] Could not send a now playing message. Invalid channel provided.`)
        const container = new ContainerBuilder();
        if(track.imageUrl != null) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems([{media: {url: track.imageUrl, width: 512, height: 512}}]))
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent([`## Now Playing`, "", `${_appListener.getDiscordProvider().guildId == "1066284388700135466" ? `<a:RadioSpin:1341207082971693178>` : `💿`} [**${decodeURI(track.title)}** — ${decodeURI(track.artist)}](${track.trackUrl})`].join("\n")));

        channel.send({flags: [MessageFlags.IsComponentsV2], components: [container]});
    }

    // POST TO DUCKY API
    if(process.env.DUCKY_API_KEY) post(`https://ducky.wiki/api/music/tracks/${track.id}`, {...track, addedTimestamp: track.lastPlayedTimestamp}, {headers: {"apikey": process.env.DUCKY_API_KEY}})

})

// DISCORD EVENTS
_appListener.getDiscordProvider().getClient().on(Events.ClientReady, () => {
    const client = _appListener.getDiscordProvider().getClient();
    console.log(`[DISCORD] Client is logged in as ${client.user.username}#${client.user.discriminator}`)
    if (config.nowPlayingUpdates) console.log(`[DISCORD] Sending now playing updates to channel ${_appListener.getDiscordProvider().getChannel(config.updateChannel)}`)
    
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

