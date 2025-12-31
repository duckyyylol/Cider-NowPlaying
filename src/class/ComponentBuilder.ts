import { ActionRowBuilder, APIActionRowComponent, APIMessageComponentEmoji, APISelectMenuOption, AttachmentBuilder, BaseSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentBuilder, ContainerBuilder, ContainerComponentBuilder, FileBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MediaGalleryItemData, MentionableSelectMenuBuilder, PartialEmoji, RGBTuple, Role, RoleSelectMenuBuilder, SectionBuilder, SelectMenuType, SeparatorBuilder, SeparatorSpacingSize, Snowflake, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, UnfurledMediaItem, UnfurledMediaItemData } from "discord.js";
import DiscordProvider, { CustomInteractionInfo } from "../provider/DiscordProvider";


export class TMButtonBuilder {
    style: ButtonStyle;
    parent: ButtonBuilder;
    customId: string;

    provider: DiscordProvider;

    constructor(provider: DiscordProvider, style: ButtonStyle, label: string, existing_button: ButtonBuilder = null) {
        this.provider = provider;
        this.style = style;
        this.parent = existing_button !== null ? existing_button : new ButtonBuilder().setLabel(label).setStyle(style);

    }

    setCustomId(customId: string | CustomInteractionInfo): TMButtonBuilder {
        if(typeof customId === "string") {
            this.parent.setCustomId(customId);
            this.customId = customId;
            return this;
        } else {
            this.parent.setCustomId(this.provider.createCustomId(customId as CustomInteractionInfo))
            this.customId = this.provider.createCustomId(customId as CustomInteractionInfo);
            return this;
        }
    }

    getCustomId(full: boolean = false): CustomInteractionInfo | string {
        if(full) {
            return this.provider.parseCustomId(this.customId);
        } else {
            return this.customId;
        }
    } 

    setLabel(label: string): TMButtonBuilder {
        this.parent.setLabel(label);
        return this;
    }

    build(): ButtonBuilder {
        return this.parent;
    }

}

export class TMComponentBuilder {
    container: ContainerBuilder;
    provider: DiscordProvider;

    constructor(provider: DiscordProvider, p_container?: ContainerBuilder) {
        if (!p_container) p_container = new ContainerBuilder();
        this.container = p_container;
        this.provider = provider;
    }

    // static buttonActionRow(id?: number): ActionRowBuilder<ButtonBuilder> {
    //     const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
    //     if(id) row.setId(id);

    //     return row;
    // }

    static actionRow(id?: number): ActionRowBuilder<any> {
        const row: ActionRowBuilder<any> = new ActionRowBuilder<any>()
        if (id) row.setId(id);

        return row;
    }

    static section(id?: number): SectionBuilder {
        const sec = new SectionBuilder()
        if (id) sec.setId(id);
        return sec;
    }

    static textDisplay(content: string, id?: number): TextDisplayBuilder {
        const text = new TextDisplayBuilder();
        text.setContent(content);
        if (id) text.setId(id);

        return text;
    }

    static separator(spacing?: SeparatorSpacingSize, showDivider?: boolean, id?: number): SeparatorBuilder {
        const sep = new SeparatorBuilder();
        sep.setSpacing(spacing ? spacing : SeparatorSpacingSize.Large);
        sep.setDivider(showDivider);
        if (id) sep.setId(id);

        return sep;
    }

    selectMenu(type: "String" | "Mentionable" | "Role" | "Channel", custom_id: CustomInteractionInfo, placeholder_text: string, disabled: boolean = false, min: number = 0, max: number = 1): BaseSelectMenuBuilder<any> {
        let select: BaseSelectMenuBuilder<any>;
        switch (type) {
            case "String": {
                select = new StringSelectMenuBuilder()
                select.setCustomId(this.provider.createCustomId(custom_id)).setPlaceholder(placeholder_text).setMaxValues(max).setMinValues(min).setDisabled(disabled)
                return select as StringSelectMenuBuilder
            }
            case "Channel": {
                select = new ChannelSelectMenuBuilder()
                select.setCustomId(this.provider.createCustomId(custom_id)).setPlaceholder(placeholder_text).setMaxValues(max).setMinValues(min).setDisabled(disabled)
                return select as ChannelSelectMenuBuilder
            }
            case "Role": {
                select = new RoleSelectMenuBuilder()
                select.setCustomId(this.provider.createCustomId(custom_id)).setPlaceholder(placeholder_text).setMaxValues(max).setMinValues(min).setDisabled(disabled)
                return select as RoleSelectMenuBuilder
            }
            case "Mentionable": {
                select = new MentionableSelectMenuBuilder()
                select.setCustomId(this.provider.createCustomId(custom_id)).setPlaceholder(placeholder_text).setMaxValues(max).setMinValues(min).setDisabled(disabled)
                return select as MentionableSelectMenuBuilder
            }

            default: {
                select = null;
                //wtf happened??
            }
        }

        if (select == null) throw new Error("Oh boy, what did you do this time?")


    }

    accessoryButton(type: ButtonStyle, button_label: string, button_url?: string, button_emoji?: APIMessageComponentEmoji, custom_id?: CustomInteractionInfo, use_existing_button?: ButtonBuilder): ButtonBuilder {
        let but: ButtonBuilder = new ButtonBuilder().setLabel(button_label);
        if (type === ButtonStyle.Link) {
            // link button
            try {
                new URL(button_url);
                but.setStyle(type);
                but.setURL(button_url)

                return but;
            } catch (_a) {
                throw new Error("BAD URL - BUTTON BUILDER")
            }
        } else {
            if (button_emoji || button_emoji !== null) but.setEmoji(button_emoji);
            if (custom_id) { but.setCustomId(this.provider.createCustomId(custom_id)); } else {
                but.setCustomId(this.provider.createCustomId({ action: "accessory-button", interactionId: Date.now().toString() }))
            }
            but.setStyle(type)

            return but;
        }
    }

    static mediaGalleryItem(media: MediaGalleryItemData): MediaGalleryItemBuilder {
        const item = new MediaGalleryItemBuilder().setURL(media.media.url)

        return item;
    }

    static mediaGallery(media: MediaGalleryItemData[], id?: number): MediaGalleryBuilder {
        const med = new MediaGalleryBuilder();
        if (id) med.setId(id);

        med.addItems(media.map(m => TMComponentBuilder.mediaGalleryItem(m)))

        return med;
    }

    static fileItem(file_url: string, id?: number): FileBuilder {
        const file = new FileBuilder();
        if (id) file.setId(id);
        try {
            new URL(file_url)
            file.setURL(file_url);

            return file;

        } catch (er) {
            throw new Error("BAD URL! - FILEBUILDER")
        }
    }

    addStringSelectMenu(custom_id: CustomInteractionInfo, placeholder_text: string, options: APISelectMenuOption[], disabled: boolean = false, min: number = 0, max: number = 1) {
        const select: StringSelectMenuBuilder = this.selectMenu("String", custom_id, placeholder_text, disabled, min, max) as StringSelectMenuBuilder
        select.addOptions(options);
        const row = TMComponentBuilder.actionRow().addComponents([select])
        this.container.addActionRowComponents(row);

        return this;
    }

    addRoleSelectMenu(custom_id: CustomInteractionInfo, placeholder_text: string, defaultRoles: Snowflake[] = [], disabled: boolean = false, min: number = 0, max: number = 1) {
        const select: RoleSelectMenuBuilder = this.selectMenu("Role", custom_id, placeholder_text, disabled, min, max) as RoleSelectMenuBuilder
        select.setDefaultRoles(defaultRoles)
        const row = TMComponentBuilder.actionRow().addComponents([select])
        this.container.addActionRowComponents(row);

        return this;
    }

    addChannelSelectMenu(custom_id: CustomInteractionInfo, placeholder_text: string, channelTypes: ChannelType[] = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice], defaultChannels: Snowflake[] = [], disabled: boolean = false, min: number = 0, max: number = 1) {
        const select: ChannelSelectMenuBuilder = this.selectMenu("Channel", custom_id, placeholder_text, disabled, min, max) as ChannelSelectMenuBuilder
        select.setChannelTypes(channelTypes)
        select.setDefaultChannels(defaultChannels)

        const row = TMComponentBuilder.actionRow().addComponents([select])
        this.container.addActionRowComponents(row);

        return this;
    }

    addMentionableSelectMenu(custom_id: CustomInteractionInfo, placeholder_text: string, defaultRoles: Snowflake[] = [], defaultUsers: Snowflake[] = [], disabled: boolean = false, min: number = 0, max: number = 1) {
        const select: MentionableSelectMenuBuilder = this.selectMenu("Mentionable", custom_id, placeholder_text, disabled, min, max) as MentionableSelectMenuBuilder
        select.addDefaultRoles(defaultRoles)
        select.addDefaultUsers(defaultUsers)

        const row = TMComponentBuilder.actionRow().addComponents([select])
        this.container.addActionRowComponents(row);

        return this;
    }

    addButtonActionRow(components: ButtonBuilder[], id?: number): TMComponentBuilder {
        let row = TMComponentBuilder.actionRow();
        if (id) row.setId(id);
        row.setComponents(components);

        this.container.addActionRowComponents(row);

        return this;

    }

    setAccentColor(color: RGBTuple | number): TMComponentBuilder {
        this.container.setAccentColor(color)
        return this;
    }

    addSeparator(spacing: SeparatorSpacingSize = SeparatorSpacingSize.Large, showDivider: boolean = true, id?: number): TMComponentBuilder {
        const sep = TMComponentBuilder.separator(spacing, showDivider)
        if (id) sep.setId(id)
        this.container.addSeparatorComponents(sep);
        return this;
    }

    addTextDisplay(content: string, id?: number): TMComponentBuilder {
        const text = TMComponentBuilder.textDisplay(content)
        if (id) text.setId(id)

        this.container.addTextDisplayComponents(text)

        return this;
    }

    addLinkButtonAccessorySection(content: string, button_label: string, button_url: string): TMComponentBuilder {
        const sec = TMComponentBuilder.section().addTextDisplayComponents(TMComponentBuilder.textDisplay(content)).setButtonAccessory(this.accessoryButton(ButtonStyle.Link, button_label, button_url))
        this.container.addSectionComponents(sec);

        return this;
    }

    addButtonAccessorySection(content: string, button_style: ButtonStyle, button_label: string, custom_id: CustomInteractionInfo, button_emoji?: APIMessageComponentEmoji, use_existing_button?: ButtonBuilder): TMComponentBuilder {
        if ((button_style === ButtonStyle.Link) && !use_existing_button) return this.addLinkButtonAccessorySection(content, button_label, "https://example.com")
        const sec = TMComponentBuilder.section().addTextDisplayComponents(TMComponentBuilder.textDisplay(content))
        if (use_existing_button) {
            sec.setButtonAccessory(use_existing_button);
            this.container.addSectionComponents(sec)
            return this;
        }
        const but = this.accessoryButton(button_style, button_label, null, null, custom_id)
        if (button_emoji && (button_emoji.id || button_emoji.name)) but.setEmoji(button_emoji)
        sec.setButtonAccessory(but)
        this.container.addSectionComponents(sec);

        return this;
    }

    addThumbnailAccessorySection(content: string, thumbnail_url: string, thumbnail_attachment?: AttachmentBuilder, id?: number): TMComponentBuilder {
        const sec = new SectionBuilder().addTextDisplayComponents(TMComponentBuilder.textDisplay(content))
        if (id) sec.setId(id);

        const thumbnail = new ThumbnailBuilder();
        if (!thumbnail_attachment) {
            try {
                new URL(thumbnail_url);

                thumbnail.setURL(thumbnail_url)
            } catch (_a) {
                throw new Error("BAD URL STUPID MF")
            }
        }
        if (thumbnail_attachment) thumbnail.setURL(`attachment://${thumbnail_attachment.name}`)

        sec.setThumbnailAccessory(thumbnail);
        this.container.addSectionComponents(sec)

        return this;
    }

    addMediaGallery(media: MediaGalleryItemData[], id?: number): TMComponentBuilder {
        const med = TMComponentBuilder.mediaGallery(media);
        if (id) med.setId(id)

        this.container.addMediaGalleryComponents(med);
        return this;
    }

    // MUST UPLOAD THE FILE IN message.files AS WELL TO APPEAR IN CONTAINER!!!!!!!!!!!
    addFile(file_url_or_attachment?: string | AttachmentBuilder): TMComponentBuilder {
        let file: FileBuilder = null;
        if (typeof file_url_or_attachment === "string") {
            file = TMComponentBuilder.fileItem(file_url_or_attachment)
            this.container.addFileComponents(file)
            return this;
        } else if (file_url_or_attachment.name !== null) {
            file = TMComponentBuilder.fileItem(`attachment://${file_url_or_attachment.name}`)
            this.container.addFileComponents(file)
            return this;
        }

    }

    addHeadingWithSeparator(content: string, headingSize: number, spacing: SeparatorSpacingSize = SeparatorSpacingSize.Large, showDivider: boolean = true): TMComponentBuilder {
        if (!content) throw new Error("Invalid Content Provided - ComponentBuilder#addHeadingWithSeparator")
        let newLines = content.split(/\\n/gim)
        if (newLines.length > 1) {
            content = `${"#".repeat(headingSize)} ${newLines[0]}${newLines.length > 1 ? "\n" : ""}${newLines.filter(s => s !== newLines[0]).join("\n")}`
        } else {
            content = `${"#".repeat(headingSize)} ${content}`
        }
        this.container.addTextDisplayComponents(TMComponentBuilder.textDisplay(content))
        this.container.addSeparatorComponents(sep => sep.setSpacing(spacing).setDivider(showDivider))

        return this;
    }

    buildContainer(): ContainerBuilder {
        return this.container;
    }
}
