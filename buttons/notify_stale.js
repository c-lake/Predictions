"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const PredictionTracker = require("../structures/PredictionTracker");
const Utils = require("../structures/Utils");

// Required by /admin stale. For reminding prediction creator to resolve stale prediction.
module.exports = {
  button: new MessageButton()
              .setCustomId('notify_stale')
              .setEmoji('🔔')
              .setLabel('Remind')
              .setStyle('PRIMARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction) {
    // Admin command. Check admin permissions
    if (!Utils.checkAdmin(interaction))
      return interaction.reply({ content: '⚠️ You do not have permissions to do this', ephemeral: true });  
    
    if (!interaction.message.embeds[0]) {
      interaction.message.delete();
      return interaction.reply({ content: '⚠️ Please do not remove the embed. Run `/admin stale` again to retry.', ephemeral: true });  
    }
    
    // Extract user ID
    const urlField = interaction.message.embeds[0].author.iconURL;
    let creator_id = "Unknown user";
    if (urlField) {
      creator_id = urlField.match(/avatars\/(.*)\//)[1];
    }

    // Check if unresolved prediction exists
    let pred = await PredictionTracker.get(interaction.guild.id, creator_id);
    if (!pred) {
      interaction.message.delete();
      return interaction.reply({ content: `⚠️ Prediction has already been resolved or refunded`, ephemeral: true });
    }

    interaction.reply(`<@${creator_id}>, time to announce results for 🔮 ${pred.title}!`);
  }
}