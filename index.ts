import express from "express";
import * as dotenv from "dotenv"
import path, { join } from "path";
import axios from "axios";
import { randomUUID } from "crypto";
import "discord.js"
import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Client, ContainerBuilder, IntentsBitField, MediaGalleryBuilder, Message, MessageFlags, SectionBuilder, SeparatorSpacingSize, TextChannel, TextDisplayBuilder, ThumbnailBuilder } from "discord.js";
import { count } from "console";
import { readFile, writeFile } from "fs/promises";

dotenv.configDotenv({ path: path.join(__dirname, "/.env") })

let trackFilePath = join(__dirname, "/tracks.json");

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

// let streak = new PingStreak("334392742266535957");

interface Track {
    id: string;
    artist: string;
    imageUrl: string;
    album: string;
    title: string;
    trackUrl: string;
    // nowplaying: boolean;
    addedTimestamp: number;
    genres: string[];

}

interface StoredTrack {
    [trackId: string]: {
        id: string;
        artist: string;
        imageUrl: string;
        album: string;
        title: string;
        trackUrl: string;
        addedTimestamp: number;
        genres: string[];
    };
}

// let uuid = randomUUID();
// let currentTrackId = uuid;
// let currentTrackTitle;

//LASTFM_API_KEY
//LASTFM_USERNAME
//LASTFM_BASE
// let lastFmUrl = `${process.env.LASTFM_BASE}/?method=user.getrecenttracks&user=${process.env.LASTFM_USERNAME}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`
let lastFmUrl = `${process.env.LASTFM_BASE}/playback/now-playing`
console.log(lastFmUrl)

let trackId;
setInterval(async () => {
    let { data }: any = await axios.get("http://localhost:1234/nowplaying") as any
    if (!data) return;
    console.log("INCOMING | CURRENT")
    console.log(data.id + " / " + trackId)
    if (trackId && trackId === data.id) return;
    // if (data.id === "0" || data.title === "Nothing is") return;
    trackId = data.id
    try {
        let json = JSON.parse((await readFile(trackFilePath, "utf-8")))
        json[data.id] = data
        await writeFile(trackFilePath, JSON.stringify(json), "utf-8")
        if (client && client.isReady()) client.emit("newTrack", data)
    } catch (e) {
        console.log("Couldn't write to tracks.json")
    }
}, 10000);

app.get("/tracks/history/overlay", async (req, res) => {
    res.sendFile(join(__dirname, "/trackHistory.html"))
})

app.get("/tracks/history", async (req, res) => {
    let payload = {
        success: false,
        data: {},
        currentTrackId: trackId ? trackId : null
    }
    let file = await readFile(trackFilePath, "utf-8");
    // console.log(file)
    if (!file) {
        res.send(payload)
        return;
    }
    let json = JSON.parse(file);
    // console.log(json)
    if (!json) {
        res.send(payload)
        return;
    }
    payload.success = true;
    payload.data = json
    res.send(payload)
})

app.get("/cover/image", async (req, res) => {
    res.sendFile(path.join(__dirname, "/cover.html"));
})

app.get("/nowplaying/genres/overlay", async (req, res) => {
    res.sendFile(path.join(__dirname, "/genres.html"))
})

app.get("/nowplaying/overlay", async (req, res) => {
    res.sendFile(path.join(__dirname, "/nowplaying.html"))
})

app.get("/pingStreak/overlay", async (req, res) => {
    res.sendFile(path.join(__dirname, "/streak.html"))
})


app.get("/splash/overlay", async (req, res) => {
    res.sendFile(path.join(__dirname, "/splash.html"))
})

app.get("/splash/text", async (req, res) => {
    if (!process.env.SPLASH_TEXT || process.env.SPLASH_TEXT === null) { res.sendStatus(404); return; }
    res.send({ success: true, text: process.env.SPLASH_TEXT })
})

app.get("/debug/:id", async (req, res) => {
    switch (req.params.id) {
        case "tracklist": {
            let payload = {
                success: false,
                data: {}
            }
            let file = await readFile(trackFilePath, "utf-8");
            // console.log(file)
            if (!file) {
                res.send(payload)
                return;
            }
            let json = JSON.parse(file);
            // console.log(json)
            if (!json) {
                res.send(payload)
                return;
            }
            payload.success = true;
            payload.data = json
            res.send(payload)

            break;
        }
        default:
            res.send({ success: false, data: {} })
            break;
    }
})

// app.get("/pingStreak", (req, res) => {
//     res.send({ count: streak.getCount() })
// })

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
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
            trackUrl: "https://ducky.wiki/trackNotFound",
            // nowplaying: true,
            addedTimestamp: Date.now(),
            genres: [],
        }

        res.send(trackData)

        return;
    }
    if (np.data.status !== "ok") {
        trackData = {
            id: "0",
            artist: "Playing",
            album: "Nothing Playing",
            title: "Nothing is",
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
            trackUrl: "https://ducky.wiki/trackNotFound",
            // nowplaying: true,
            addedTimestamp: Date.now(),
            genres: []
        }

        res.send(trackData)

        return;
    }
    // res.send(np.data.recenttracks)
    let firstTrack = np.data.info

    try {
        // if (firstTrack["@attr"]?.nowplaying) {
        // let songId = btoa(encodeURI(firstTrack.name))
        let songId = firstTrack?.playParams.id
        trackData = {
            id: songId,
            album: firstTrack.albumName ? encodeURI(firstTrack.albumName) : "Nothing Playing",
            artist: firstTrack.artistName ? encodeURI(firstTrack.artistName) : "playing",
            title: firstTrack.name ? encodeURI(firstTrack.name) : encodeURI("Nothing is"),
            imageUrl: firstTrack.artwork.url ? firstTrack.artwork.url.replace(/\{w\}/gim, "512").replace(/\{h\}/gim, 512) : "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
            trackUrl: firstTrack.url ? firstTrack.url : "https://ducky.wiki/trackNotFound",
            // artist: firstTrack.artist['#text'] ? encodeURI(firstTrack.artist['#text']) : "Playing",
            // album: firstTrack.album["#text"] ? encodeURI(firstTrack.album["#text"]) : "Nothing Playing",
            // title: firstTrack.name ? encodeURI(firstTrack.name) : "Nothing is",
            // imageUrl: firstTrack.image.find(i => i.size === "extralarge")["#text"] ? firstTrack.image.find(i => i.size === "extralarge")["#text"] : "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
            // trackUrl: firstTrack.url ? firstTrack.url : "https://ducky.wiki/trackNotFound",
            genres: firstTrack.genreNames.length > 0 ? firstTrack.genreNames : [],
            addedTimestamp: Date.now()
        }

        if (trackData.title !== null && trackData.artist !== null && trackData.imageUrl !== null) {
            res.send(trackData)

            // return;
        }
        // } else {
        //     trackData = {
        //         id: "0",
        //         artist: "Playing",
        //         album: "Nothing Playing",
        //         title: "Nothing is",
        //         imageUrl: "https://picsum.photos/150",
        //         nowplaying: false,
        //         trackUrl: "https://example.com"
        //     }

        // currentTrackId = trackData.id


        // res.send(trackData)

    } catch (err) {
        res.send({
            id: "0",
            artist: "Playing",
            album: "Nothing Playing",
            title: "Nothing is",
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
            trackUrl: "https://ducky.wiki/trackNotFound",
            // nowplaying: true,
            genres: [],
            addedTimestamp: Date.now()
        })
        console.log("AXIOS", err)
    }

})

const issues = [
    { name: "Music Playback", value: "playback" }, { name: "Bot Commands", value: "commands" }, { name: "Stream/Overlays", value: "stream" }, { name: "Report a Song", value: "song" }
]

const discordCommands: ApplicationCommandData[] = [
    {
        name: "last5",
        description: "View the last 5 tracks played",
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: "somethingbroke",
        description: "Report an issue with the system.",
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: "what-broke",
                description: "What is broken",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: issues
            },
            {
                name: "what-happened",
                description: "Please describe the issue with as much detail as possible.",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    }
]

client.on("ready", async (c) => {
    console.log(client.user?.username)
    client.application?.commands.set(discordCommands).then(r => {
        console.log(`LOADED ${discordCommands.length} command${discordCommands.length === 1 ? "" : "s"}`)
    });
    // let trackId;
    // setInterval(async () => {
    //     let { data }: any = await axios.get("http://localhost:1234/nowplaying") as any
    //     if (!data) return;
    //     console.log("INCOMING | CURRENT")
    //     console.log(data.id + " / " + trackId)
    //     if (trackId && trackId === data.id) return;
    //     // if (data.id === "0" || data.title === "Nothing is") return;
    //     trackId = data.id
    //     client.emit("newTrack", data)
    // }, 10000);

})

client.on("newTrack", (track: Track) => {
    if (track.id === "0") return console.log("NOTHING IS PLAYING!")
    console.log(client?.user?.username)
    console.log("NEW SONG")
    console.log(track)
    let channelId = process.env.CHANNEL_ID as string;
    let channel: TextChannel = client.guilds.cache.get(process.env.GUILD_ID as string)?.channels.cache.get(channelId) as TextChannel
    let container = new ContainerBuilder().addMediaGalleryComponents(new MediaGalleryBuilder().addItems([{ media: { url: track.imageUrl, width: 1024, height: 1024 } }])).addTextDisplayComponents(new TextDisplayBuilder().setContent([`## <a:RadioSpin:1341207082971693178> Now Playing`, `[**${decodeURI(track.title)}** — ${decodeURI(track.artist)}](${track.trackUrl})`, "", "-# Hunted a bug? Let us know with </somethingbroke:1384060315066437715>!"].join("\n")))
    // .addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large))
    // .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ducky Radio — vibe out :)`))
    channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] })
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "last5") {
            let trackList: Track[] = [];
            let tracks: StoredTrack = JSON.parse(await readFile(trackFilePath, "utf-8"))
            Object.entries(tracks)
                .sort((a, b) => b[1].addedTimestamp - a[1].addedTimestamp)
                .forEach((entry, index) => {

                    //   console.log(entry);
                    if (trackId && trackId === entry[0]) return;
                    let track: any = entry[1] as Track;
                    //   console.log(index, track.addedTimestamp, track.id);
                    if (trackList.length < 5) trackList.push(track);
                });

            console.log("YES")
            console.log(trackList.length)
            console.log("YES")

            const container = new ContainerBuilder();
            // container.setAccentColor()
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(["## ducky radio™️", "-# Last 5 tracks played"].join("\n")))
            trackList.forEach((track: Track, index) => {
                container.addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large))
                container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent([`### ${index + 1}. ${decodeURI(track.title)} — ${decodeURI(track.artist)} [${decodeURI(track.album)}]`, `-# <t:${Math.floor(track.addedTimestamp / 1000)}:R>`, "", `[View this Track](${track.trackUrl})`].join("\n"))).setThumbnailAccessory(new ThumbnailBuilder().setURL(track.imageUrl)))

            })



            interaction.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [container] })

        }
        if (interaction.commandName === "somethingbroke") {
            let logChannel: TextChannel = client.guilds.cache.get(process.env.GUILD_ID as string)?.channels.cache.get(process.env.ADMIN_CHANNEL as string) as TextChannel
            let issue = interaction.options.getString("what-broke", true)
            let explanation = interaction.options.getString("what-happened", true)
            let realIssue = issues.find(i => i.value === issue)?.name
            let errorCon = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## <@334392742266535957>, Something Broke\n${interaction.user.username} reported an issue regarding **${realIssue}** <t:${Math.floor(Date.now() / 1000)}:R>`)).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Issue Description\n\`\`\`${explanation}\`\`\``))

            let currentTrack: Track = await (await axios.get("http://localhost:1234/nowplaying")).data
            if (issue === "song" && currentTrack) {
                let reportCon = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Song Report\n${interaction.user.username} reported the following track <t:${Math.floor(Date.now() / 1000)}:R>`)).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addSectionComponents(new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### [${decodeURI(currentTrack.title)} — ${decodeURI(currentTrack.artist)} [${decodeURI(currentTrack.album)}]](${currentTrack.trackUrl})`)).setThumbnailAccessory(new ThumbnailBuilder().setURL(currentTrack.imageUrl))).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Issue Description\n\`\`\`${explanation}\`\`\``))
                logChannel.send({ flags: [MessageFlags.IsComponentsV2], components: [reportCon] })
            } else {
                logChannel.send({ flags: [MessageFlags.IsComponentsV2], components: [errorCon] })
            }
            interaction.reply({ content: `The ${issue === "song" ? "song" : "issue"} has been successfully reported${(issue === "song" && currentTrack) ? `\n\n**${decodeURI(currentTrack.title)} — ${decodeURI(currentTrack.artist)}**` : ""}`, flags: [MessageFlags.Ephemeral] })
        }

    }
})

// client.on("messageCreate", async (message: Message) => {
//     // console.log(message)
//     if (message.author.bot) return;
//     if (message.channelId !== process.env.CHANNEL_ID || message.guildId !== process.env.GUILD_ID) return;
//     // let user = streak.getUserId();

//     let dev = true;
//     console.log(message.mentions.users.has(user))
//     if (message.mentions.users.has(user) && (!dev && message.author.id === user)) return;
//     if (message.mentions.users.has(user)) {

//         message.reply({ flags: [MessageFlags.IsComponentsV2], components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ducky is asleep!\nbut she's still here, providing the vibes. stick around and hang out, enjoy the Minecraft jams :)`)).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`if you can't hear the music, unmute or turn up <@1265790838789640343>, ya dork!`))] })
//         streak.add();
//         if (!dev) {
//             let nowplaying = await axios.get("http://localhost:1234/nowplaying")
//             message.react("1339305319108706305")
//             message.reply({ flags: [MessageFlags.IsComponentsV2], components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent([`## 🔥 Ping Streak`, `*ducky has been pinged ${streak.getCount()}* time${streak.getCount() === 1 ? "" : "s"}!`, ``, `ducky is asleep! Obviously, the best thing to do is build up a ping streak!`, ``, `Check ducky's stream to see the live streak, and vibe out with ducky's re-animated corpse.`].join("\n"))).addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Large)).addTextDisplayComponents(new TextDisplayBuilder().setContent([`### Now Playing`, `> <a:RadioSpin:1341207082971693178> [**${nowplaying.data.title}** — ${nowplaying.data.artist}](${nowplaying.data.trackUrl})`].join("\n")))] })
//         }
//     }
// })

app.listen(process.env.PORT, async (er) => {
    console.log("LISTENING!")
    // let file = await readFile(trackFilePath, "utf-8")
    // if (!file) {
    //     await writeFile(trackFilePath, JSON.stringify({}))
    // }
})
if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "") { client.login(process.env.DISCORD_TOKEN) }