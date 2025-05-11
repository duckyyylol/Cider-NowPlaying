import express from "express";
import * as dotenv from "dotenv"
import path from "path";
import axios from "axios";
import { randomUUID } from "crypto";
import "discord.js"
import { Client, ContainerBuilder, IntentsBitField, MediaGalleryBuilder, Message, MessageFlags, SectionBuilder, SeparatorSpacingSize, TextChannel, TextDisplayBuilder, ThumbnailBuilder } from "discord.js";
import { count } from "console";

dotenv.configDotenv({ path: path.join(__dirname, "/.env") })

const app = express();
const client: Client = new Client({
    intents: [IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildModeration,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.GuildVoiceStates,]
})

class PingStreak {
    count: number;
    owner_id: string;
    constructor(user_id: string) {
        this.count = 0;
        this.owner_id = user_id;
    }

    add(): number {
        this.count = this.count + 1;
        return this.count;
    }

    getCount(): number {
        return this.count;
    }

    getUserId(): string {
        return this.owner_id;
    }

}

let streak = new PingStreak("334392742266535957");

interface Track {
    id: string;
    artist: string;
    imageUrl: string;
    album: string;
    title: string;
    nowplaying: boolean;
    trackUrl: string;
}

// let uuid = randomUUID();
// let currentTrackId = uuid;
// let currentTrackTitle;

//LASTFM_API_KEY
//LASTFM_USERNAME
//LASTFM_BASE
let lastFmUrl = `${process.env.LASTFM_BASE}/?method=user.getrecenttracks&user=${process.env.LASTFM_USERNAME}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`

app.get("/nowplaying/overlay", async (req, res) => {
    res.sendFile(path.join(__dirname, "/nowplaying.html"))
})

app.get("/pingStreak/overlay", async (req, res) => {
    res.sendFile(path.join(__dirname, "/streak.html"))
})

app.get("/pingStreak", (req, res) => {
    res.send({ count: streak.getCount() })
})

app.get("/nowplaying", async (req, res): Promise<any> => {
    let np = await axios.get(lastFmUrl)
    // console.log(np.data.recenttracks)
    // if (np) res.send(np.data.recenttracks[0])
    let trackData: Track;
    if (!np) {
        trackData = {
            id: "0",
            artist: "Playing",
            album: "Nothing Playing",
            title: "Nothing is",
            imageUrl: "https://picsum.photos/150",
            nowplaying: false,
            trackUrl: "https://example.com"
        }

        res.send(trackData)
    }
    if (!np.data.recenttracks) return res.sendStatus(404)
    // res.send(np.data.recenttracks)
    let firstTrack = np.data.recenttracks.track[0]

    if (firstTrack["@attr"]?.nowplaying) {
        let songId = btoa(firstTrack.name)
        trackData = {
            id: songId,
            artist: firstTrack.artist['#text'],
            album: firstTrack.album["#text"],
            title: firstTrack.name,
            imageUrl: firstTrack.image.find(i => i.size === "large")["#text"],
            nowplaying: firstTrack["@attr"].nowplaying,
            trackUrl: firstTrack.url
        }

        if (trackData.title !== null && trackData.artist !== null && trackData.imageUrl !== null) {
            res.send(trackData)
        }
    } else {
        trackData = {
            id: "0",
            artist: "Playing",
            album: "Nothing Playing",
            title: "Nothing is",
            imageUrl: "https://picsum.photos/150",
            nowplaying: false,
            trackUrl: "https://example.com"
        }

        // currentTrackId = trackData.id


        res.send(trackData)
    }

})

client.on("ready", async (c) => {
    console.log(client.user?.username)
    let trackId;
    setInterval(async () => {
        let { data }: any = await axios.get("http://localhost:1234/nowplaying") as any
        console.log("INCOMING | CURRENT")
        console.log(data.id + " / " + trackId)
        if (trackId && trackId === data.id) return;
        // if (data.id === "0" || data.title === "Nothing is") return;
        trackId = data.id
        client.emit("newTrack", data)
    }, 5000);
})

client.on("newTrack", (track: Track) => {
    if (track.id === "0") return console.log("NOTHING IS PLAYING!")
    console.log(client?.user?.username)
    console.log("NEW SONG")
    console.log(track)
    let channelId = "1370893947605618782"
    let channel: TextChannel = client.guilds.cache.get(process.env.GUILD_ID as string)?.channels.cache.get(channelId) as TextChannel
    let container = new ContainerBuilder().addMediaGalleryComponents(new MediaGalleryBuilder().addItems([{ media: { url: track.imageUrl } }])).addTextDisplayComponents(new TextDisplayBuilder().setContent([`## Now Playing`, `<a:RadioSpin:1341207082971693178> [**${track.title}** — ${track.artist}](${track.trackUrl})`].join("\n"))).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ducky Radio — vibe out :)`))
    channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] })
})

client.on("messageCreate", async (message: Message) => {
    // console.log(message)
    if (message.author.bot) return;
    if (message.channelId !== process.env.CHANNEL_ID || message.guildId !== process.env.GUILD_ID) return;
    let user = streak.getUserId();

    let dev = true;
    console.log(message.mentions.users.has(user))
    if (message.mentions.users.has(user) && (!dev && message.author.id === user)) return;
    if (message.mentions.users.has(user)) {

        streak.add();
        if (!dev) {
            let nowplaying = await axios.get("http://localhost:1234/nowplaying")
            message.react("1339305319108706305")
            message.reply({ flags: [MessageFlags.IsComponentsV2], components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent([`## 🔥 Ping Streak`, `*ducky has been pinged ${streak.getCount()}* time${streak.getCount() === 1 ? "" : "s"}!`, ``, `ducky is asleep! Obviously, the best thing to do is build up a ping streak!`, ``, `Check ducky's stream to see the live streak, and vibe out with ducky's re-animated corpse.`].join("\n"))).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addTextDisplayComponents(new TextDisplayBuilder().setContent([`### Now Playing`, `> <a:RadioSpin:1341207082971693178> [**${nowplaying.data.title}** — ${nowplaying.data.artist}](${nowplaying.data.trackUrl})`].join("\n")))] })
        }
    }
})

app.listen(process.env.PORT, (er) => {
    console.log("LISTENING!")
})
client.login(process.env.DISCORD_TOKEN)