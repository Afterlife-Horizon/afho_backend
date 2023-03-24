const {getVoiceConnection} = require("@discordjs/voice");

module.exports = function (client) {
    return (
        // ------------ Checking channels voice state updates ------------
        client.on("voiceStateUpdate", async (oldState, newState) => {
            if (newState.id == client.user.id && newState.channelId && newState.channel.type == "GUILD_STAGE_VOICE" && newState.suppress) {
                if (newState.channel?.permissionsFor(newState.guild.me)?.has(PermissionFlagsBits.MuteMembers)) {
                    await newState.guild.me.voice.setSuppressed(false).catch(() => null);
                }
            }

            if (newState.id == client.user.id) return;

            function stateChange(one, two) {
                return (one === false && two === true || one === true && two === false);
            }

            if (stateChange(oldState.streaming, newState.streaming) ||
                stateChange(oldState.serverDeaf, newState.serverDeaf) ||
                stateChange(oldState.serverMute, newState.serverMute) ||
                stateChange(oldState.selfDeaf, newState.selfDeaf) ||
                stateChange(oldState.selfMute, newState.selfMute) ||
                stateChange(oldState.selfVideo, newState.selfVideo) ||
                stateChange(oldState.suppress, newState.suppress)) {
                return;
            }

            // channel joins
            if (!oldState.channelId && newState.channelId) {
                return;
            }

            // channel leaves
            if (!newState.channelId && oldState.channelId || newState.channelId && oldState.channelId) {
                if (oldState.channel.members.filter(m => !m.user.bot).size <= 0) console.log("[LOG] Channel is empty!".yellow);
                setTimeout(() => {
                    const connection = getVoiceConnection(newState.guild.id);
                    if (oldState.channel.members.filter(m => !m.user.bot).size >= 1) return;
                    if (connection && connection.joinConfig.channelId == oldState.channelId) connection.destroy();
                    return;
                }, 15000);
            }
        })
    );
}