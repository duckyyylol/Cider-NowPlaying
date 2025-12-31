import { PermissionResolvable, ApplicationCommandType, ApplicationCommandOptionData, ChatInputCommandInteraction, ContextMenuCommandInteraction, AutocompleteInteraction, PermissionFlagsBits, EntryPointCommandHandlerType, ApplicationIntegrationType, ChatInputApplicationCommandData, InteractionContextType, MessageApplicationCommandData, PrimaryEntryPointCommandData, UserApplicationCommandData } from "discord.js";
import DiscordProvider from "../provider/DiscordProvider";

export class CommandBuilder {
    enabled: boolean;
    name: string;
    description: string;
    defaultPermission: PermissionResolvable;
    type: ApplicationCommandType;
    options: ApplicationCommandOptionData[];
    run: (i: ChatInputCommandInteraction | ContextMenuCommandInteraction, provider: DiscordProvider) => void;
    autocomplete: (i: AutocompleteInteraction) => void;
    constructor(name: string, description: string,) {
        this.name = name;
        this.enabled = true;
        this.description = description;

        this.type = ApplicationCommandType.ChatInput;
        this.defaultPermission = PermissionFlagsBits.ViewChannel;
        this.run = null;
        this.autocomplete = null;
    }
    disable(): CommandBuilder {
        this.enabled = false;
        return this;
    }

    setType(type: ApplicationCommandType): CommandBuilder {
        this.type = type;
        return this;
    }

    isSlashCommand(): boolean {
        return this.type === ApplicationCommandType.ChatInput;
    }

    isMessageContextCommand(): boolean {
        return this.type === ApplicationCommandType.Message;
    }

    isUserContextCommand(): boolean {
        return this.type === ApplicationCommandType.User;
    }

    setName(name: string): CommandBuilder {
        this.name = name;

        return this;
    }

    setDefaultPermission(permission: PermissionResolvable): CommandBuilder {
        this.defaultPermission = permission;
        return this;
    }

    setOptions(options: ApplicationCommandOptionData[]): CommandBuilder {
        this.options = options;
        return this;
    }

    setRunMethod(callback: (interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction, provider: DiscordProvider) => void): CommandBuilder {
        this.run = callback;
        return this;
    }

    setAutocompleteMethod(callback: (interaction: AutocompleteInteraction) => void): CommandBuilder {
        this.autocomplete = callback;
        return this;
    }

    hasRunMethod(): boolean {
        return this.run === null ? false : true;
    }

    hasAutocompleteMethod(): boolean {
        return this.autocomplete === null ? false : true;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getRunMethod(): (...args) => void {
        return this.run;
    }

    getAutocompleteMethod(): (...args) => void {
        return this.autocomplete;
    }

    getData(): ChatInputApplicationCommandData | UserApplicationCommandData | MessageApplicationCommandData  {
        switch(this.type) {
            case ApplicationCommandType.ChatInput: {
                let toReturn: ChatInputApplicationCommandData = {
                    type: this.type,
                    description: this.description,
                    name: this.name,
                    defaultMemberPermissions: this.defaultPermission,
                    integrationTypes: [ApplicationIntegrationType.GuildInstall],
                    contexts: [InteractionContextType.Guild]
                }

                if(this?.options?.length > 0) toReturn.options = this.options;

                return toReturn;
            }
            case ApplicationCommandType.User: {
                let toReturn: UserApplicationCommandData = {
                    type: this.type,
                    name: this.name,
                    defaultMemberPermissions: this.defaultPermission,
                    contexts: [InteractionContextType.Guild],
                    nsfw: false,
                    integrationTypes: [ApplicationIntegrationType.GuildInstall]
                }

                return toReturn;
            }
            case ApplicationCommandType.Message: {
                let toReturn: MessageApplicationCommandData = {
                    type: this.type,
                    name: this.name,
                    defaultMemberPermissions: this.defaultPermission,
                    contexts: [InteractionContextType.Guild],
                    nsfw: false,
                    integrationTypes: [ApplicationIntegrationType.GuildInstall]
                }

                return toReturn;
            }
            default: {
                return null;
            }
        }
    }
}