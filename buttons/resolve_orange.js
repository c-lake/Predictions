"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const resolve_blue = require("./resolve_blue");

// Required by /resolve. For announcing that orange is the winner.
module.exports = {
  button: new MessageButton()
              .setCustomId('resolve_orange')
              .setEmoji('🔶')
              .setStyle('SECONDARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction) {
    // Call BlueButton
    resolve_blue.execute(interaction, 2)
  }
}