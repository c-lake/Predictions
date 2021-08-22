"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");

// Required by /refund
module.exports = {
  button: new MessageButton()
              .setCustomId('cancel_refund')
              .setEmoji('✖️')
              .setLabel('Cancel')
              .setStyle('SECONDARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction) {
    interaction.update({ content: "✅ Cancelled refund. Use `/resolve` to announce results!", embeds: [], components: [] });
  }
}