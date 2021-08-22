"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const HelpGenerator = require('../structures/HelpGenerator')

module.exports = {
  data: new SlashCommandBuilder()
            .setName('help')
            .setDescription('Documentations for Predictions'),

  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction) {
    // Send the first help page, disable the first button
    const row = HelpGenerator.getRow();
    row.components[0].setDisabled(true);

    await interaction.reply({ embeds: [Object.entries(HelpGenerator.embeds)[0][1]], components: [row] });
  }
}