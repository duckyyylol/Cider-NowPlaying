import { MessageFlags } from "discord.js";
import { CommandBuilder } from "../class/CommandBuilder";
import { TMComponentBuilder } from "../class/ComponentBuilder";
import { JSON_StoredTrack, Track } from "../provider/AudioServiceProvider";
import { _appListener, trackHistoryProvider } from "..";

const Command_last5 = new CommandBuilder("last5", "View the last 5 tracks, and get a link to each track.")

function urlize(track: Track, index: number): string {
    return `## ${index + 1}. ${!track.trackUrl.includes("notfound") ? `[${decodeURIComponent(track.title)} - ${decodeURIComponent(track.artist)}${track.album !== null ? ` [${decodeURIComponent(track.album)}]` : ""}](${track.trackUrl})` : `${decodeURIComponent(track.title)} - ${decodeURIComponent(track.artist)}${track.album !== null ? ` [${decodeURIComponent(track.album)}]` : ""}`}\n-# **Last Played:** <t:${Math.floor(track.lastPlayedTimestamp / 1000)}:R>`
}

Command_last5.setRunMethod((interaction, provider) => {
    let history: JSON_StoredTrack | [string, Track][] = trackHistoryProvider.getData().data as JSON_StoredTrack;
    history = Object.entries(history).filter(([id, track]) => track.imageUrl !== null).sort((a, b) => b[1].lastPlayedTimestamp - a[1].lastPlayedTimestamp);
    history = history.slice(0, 5);

    const container = new TMComponentBuilder(provider);

    container.addThumbnailAccessorySection(`# ducky radio\n-# Last 5 tracks played`, 'https://ducky.wiki/public/img/ducky.gif')

    history.forEach(([id, track], index) => {
        container.addSeparator();
        container.addThumbnailAccessorySection(urlize(track, index), track.imageUrl);
    })

    interaction.reply({flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [container.buildContainer()]})
})

export default Command_last5;