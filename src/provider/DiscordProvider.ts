import { AutocompleteInteraction, ChatInputApplicationCommandData, ChatInputCommandInteraction, Client, ComponentType, Guild, GuildBasedChannel, GuildChannel, IntentsBitField, Interaction, SendableChannels, TextBasedChannel } from "discord.js";
import RPC from "discord-rpc"
import { Track } from "./AudioServiceProvider";
import { join } from "node:path";
import { ensureDirSync, existsSync, readdirSync } from "fs-extra";
import { CommandBuilder } from "../class/CommandBuilder";

interface CommandAddons {
    enabled: boolean;
    run: (interaction: ChatInputCommandInteraction, provider: DiscordProvider) => void;
    autocomplete?: (interaction: AutocompleteInteraction) => void;
}

type CommandWithAddons = ChatInputApplicationCommandData & CommandAddons;

export interface DiscordCommand extends CommandWithAddons { };

export type CustomInteractionInfo = {
    command?: string;
    subcommandGroup?: string;
    subcommand?: string;
    componentType?: ComponentType;
    action: string;
    interactionId: string;
}

export default class DiscordProvider {
    commandDataDir: string;
    commandMap: Map<string, CommandBuilder>

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
        this.commandDataDir = join(process.cwd(), "src", "command");
        ensureDirSync(this.commandDataDir);

        this.commandMap = new Map<string, CommandBuilder>();

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

        this.rpcClient = new RPC.Client({ transport: "ipc" });

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
            console.log(`[DISCORD] Now Playing messages will not send. Please provide a DISCORD_GUILD_ID`)
        }

        if ([this.largeImageKey, this.largeImageText, this.smallImageKey, this.smallImageText].includes(null)) {
            this.rpcConfigured = false;
            console.log(`[DISCORD] Rich presence will not initialize. One or more required values were not provided`)
        }

        if (this.clientId == null) {
            this.ready = false;
            this.rpcConfigured = false;
            console.log(`[DISCORD] Client ID was not provided. Discord integration will not initialize`)
            console.log(`[DISCORD] Client ID was not provided. Rich Presence will not initialize`)
        }
        if (this.clientSecret == null) {
            this.ready = false;
            console.log(`[DISCORD] Client Secret was not provided. Discord integration will not initialize`)
        }
        if (this.token == null) {
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
        if (!guild) return null;
        return guild;
    }

    getChannel(channelId: string): SendableChannels {
        const guild = this.getGuild();
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return null;
        if (!channel.isSendable()) return null;
        return channel;
    }

    getCommandMap(): Map<string, CommandBuilder> {
        return this.commandMap;
    }

    createCustomId(data: CustomInteractionInfo): string {
        return `${data.command ? `${data.command}` : ""}.${data.subcommandGroup ? `${data.subcommandGroup}` : ""}.${data.subcommand ? `${data.subcommand}` : ""}.${data.componentType ? `${Object.values(ComponentType)[data.componentType - 1]}` : ""}.${data.action}#${data.interactionId}`
    }

    generateCustomId(interaction: Interaction, action: string, componentType?: ComponentType): string {
        let data: CustomInteractionInfo = {
            action,
            interactionId: interaction.id
        }

        if (componentType) data.componentType = componentType

        if (interaction.isChatInputCommand()) {
            data.command = interaction.commandName
            if (interaction.options.getSubcommandGroup(false)) data.subcommandGroup = interaction.options.getSubcommandGroup(false)
            if (interaction.options.getSubcommand(false)) data.subcommand = interaction.options.getSubcommand(false)
        }

        return this.createCustomId(data);
    }

    parseCustomId(id: string, failHard = true): CustomInteractionInfo {
        const hashSplit = id.split("#")
        if (hashSplit.length < 2) {
            if (failHard) throw new Error(`Invalid custom ID: ${id}`)
            return null;
        }

        const headerData = hashSplit[0].split(".")
        if (hashSplit.length == 0) {
            if (failHard) throw new Error(`Invalid custom ID: ${id}`)
            return null;
        }

        let data: CustomInteractionInfo = {
            interactionId: hashSplit[1],
            action: headerData[headerData.length - 1]
        }

        if (headerData[0].length > 0) data.command = headerData[0]
        if (headerData[1].length > 0) data.subcommandGroup = headerData[1]
        if (headerData[2].length > 0) data.subcommand = headerData[2]
        if (headerData[3].length > 0) data.componentType = Object.values(ComponentType).indexOf(headerData[3]) + 1

        return data;
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

        if (!res || res == null) return false;
        return true;
    }

    loadCommands() {
        let commands: ChatInputApplicationCommandData[] = [];
        const commandFiles = readdirSync(this.commandDataDir);
        for (const file of commandFiles.filter(x => x.endsWith(process.argv.includes("-js") ? ".js" : ".ts"))) {
            const command: CommandBuilder = (require(join(this.commandDataDir, file))).default;

            if (!command || command === null) return console.log(`[DISCORD] Could not load command file ${file} - Command format invalid`);
            if (command.getDescription().length <= 0) return console.log(`[DISCORD] Could not load command file ${file} - Command description invalid`);
            if (command.getName().length <= 0) return console.log(`[DISCORD] Could not load command file ${file} - Command name invalid`);
            if (!command.isEnabled()) return console.log(`[DISCORD] Could not load command file ${file} - Command disabled`);
            if (!command.hasRunMethod()) return console.log(`[DISCORD] Could not load command file ${file} - Command does not have a run method`);

            commands.push(command.getData() as ChatInputApplicationCommandData);
            this.commandMap.set(command.getName(), command);
        }

        this.client.application.commands.set(commands).then(coms => {

            console.log(`[DISCORD] Successfully added ${coms.size} command(s)`)
            console.log(`| [DISCORD] Command List\n`, coms.map(com => `| /${com.name} - ${com.description}`).join("\n"))
        }).catch(err => {
            console.log(`[DISCORD] Failed to set application commands. Error:`, err);
        })
    }

    init(): void {
        if (!this.ready) {
            console.log(`[DISCORD] Discord integration did not initialize`)
            return;
        } else {
            this.rpcClient.connect(this.clientId);
            this.client.login(this.token);
        }
    }
}