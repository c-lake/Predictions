"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const PredictionTracker = require("../structures/PredictionTracker");

// Required by /resolve. For announcing that blue is the winner.
module.exports = {
  button: new MessageButton()
              .setCustomId('resolve_blue')
              .setEmoji('🔷')
              .setStyle('SECONDARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction, option=1) {
    // Check if unresolved prediction exists
    let pred = await PredictionTracker.get(interaction.guild.id, interaction.user.id);
    if (!pred)
      return interaction.followUp({ content: '⚠️ You do not have any unresolved prediction', ephemeral: true });
    
    // Block resolution if the prediction is active
    if (pred.active)
      return interaction.followUp({ content: `⚠️ Prediction is ongoing. Use \`/stop\` before resolving.`, ephemeral: true })

    // Handle coin flip (option = -1)
    let coinImage = null;
    if (option === -1) {
      const flip = Math.random() < 0.5 ? 'head' : 'tail';
      coinImage = flip === 'head' ? 'https://cdn.discordapp.com/emojis/818149902106361856.png?v=1' : 'https://cdn.discordapp.com/emojis/818149914592804865.png?v=1';
      option = flip === 'head' ? 1 : 2;
    }
    
    // Send results embed
    let resultEmbed = (await pred.resolve(interaction.guild, option))
                      .setThumbnail(coinImage)
                      .setAuthor(interaction.member.displayName + (coinImage ? " flipped a coin" : " announced results"), interaction.user.avatarURL());

    await interaction.update({ content: `🔮 ${pred.title} - Announcing results`, components: [] });
    interaction.channel.send({ embeds: [resultEmbed] });

    // Unregister prediction from PredictionTracker
    await PredictionTracker.purge(interaction.guild.id, interaction.user.id);  }
}