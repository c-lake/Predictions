"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const refund_stale = require("./refund_stale");

// Required by /refund
module.exports = {
  button: new MessageButton()
              .setCustomId('confirm_refund')
              .setEmoji('💰')
              .setLabel('Refund')
              .setStyle('DANGER'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction) {
    // Call refund_stale
    refund_stale.execute(interaction, true);
  }
}