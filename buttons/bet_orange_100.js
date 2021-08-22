"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const bet_blue_10 = require("./bet_blue_10");

// Bet button. Shown in prediction embed from /start and /bet
module.exports = {
  button: new MessageButton()
              .setCustomId('bet_orange_100')
              .setEmoji('🔶')
              .setLabel('100')
              .setStyle('SECONDARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction) {
    // Call bet_blue_10 button
    bet_blue_10.execute(interaction, 2, 100);
  }
}