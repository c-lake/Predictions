"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const PredictionTracker = require("../structures/PredictionTracker");
const Utils = require("../structures/Utils");

// Required by /admin stale
module.exports = {
  button: new MessageButton()
              .setCustomId('refund_stale')
              .setEmoji('💰')
              .setLabel('Refund')
              .setStyle('DANGER'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction, creator=false) {
    // Admin command. Check admin permissions.
    // Also allow for /refund call by using creator=true
    if (!Utils.checkAdmin(interaction) && !creator)
      return interaction.reply({ content: '⚠️ You do not have permissions to do this. If you are the creator of prediction, use `/refund`.', ephemeral: true });  

    if (!interaction.message.embeds[0]) {
      interaction.message.delete();
      return interaction.reply({ content: '⚠️ Please do not remove the embed. Run `/admin stale` again to retry.', ephemeral: true });  
    }

    // Extract user ID
    const urlField = interaction.message.embeds[0].author.iconURL;
    const authorField = interaction.message.embeds[0].author.name;
    let creator_id = "Unknown user";
    if (urlField) {
      creator_id = urlField.match(/avatars\/(.*)\//)[1];
    }
    else {
      creator_id = authorField.match(/Deleted account (.*) created/)[1];
    }

    // Check if unresolved prediction exists
    let pred = await PredictionTracker.get(interaction.guild.id, creator_id);
    if (!pred) {
      interaction.message.delete();
      return interaction.reply({ content: `⚠️ Prediction has already been resolved or refunded`, ephemeral: true });
    }
    
    // Block refund if the prediction is active. Should not happen as only stale predictions would activate this.
    if (pred.active)
      return interaction.reply({ content: '⚠️ Prediction is ongoing. Use /stop before refunding', ephemeral: true })
      
    // Refund to participants
    await pred.refund();

    // Unregister prediction for member in PredictionTracker
    await PredictionTracker.purge(interaction.guild.id, creator_id);

    interaction.update({ content: `✅ Refunded successfully for prediction 🔮 ${pred.title}`, embeds: [], components: [] });

    // Inform everyone
    interaction.channel.send({ content: `<@${interaction.user.id}> has cancelled prediction 🔮 ${pred.title} and refunded everyone.` });
  }
}