import { GatewayIntentBits, Partials, ClientOptions } from "discord.js"

export const botOptions = {
    presence: {
        status: "dnd"
    },
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember
    ],
    failIfNotExists: false,
    allowedMentions: {
        parse: ["roles", "users"],
        repliedUser: false
    },
    shards: "auto"
} satisfies ClientOptions
