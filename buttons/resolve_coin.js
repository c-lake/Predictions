"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const resolve_blue = require("./resolve_blue");

// Required by /resolve. For flipping coin to decide the winner.
module.exports = {
  button: new MessageButton()
              .setCustomId('resolve_coin')
              .setEmoji('<:50tail:818149914592804865>')
              .setLabel('Flip a coin')
              .setStyle('SECONDARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction) {
    // Call BlueButton
    resolve_blue.execute(interaction, -1)
  }
}