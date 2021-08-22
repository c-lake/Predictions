"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageActionRow } = require('discord.js');
const resolve_blue = require('../buttons/resolve_blue');
const resolve_coin = require('../buttons/resolve_coin');
const resolve_orange = require('../buttons/resolve_orange');
const PredictionTracker = require('../structures/PredictionTracker');

module.exports = {
	data: new SlashCommandBuilder()
            .setName('resolve')
            .setDescription('Announce results for your prediction'),
        
  /**
   * 
   * @param {CommandInteraction} interaction 
   * @returns 
   */         
  async execute(interaction) {
    // Check if unresolved prediction exists
    let pred = await PredictionTracker.get(interaction.guild.id, interaction.user.id);
    if (!pred)
      return interaction.reply({ content: '⚠️ You do not have any unresolved prediction', ephemeral: true });

    // Block resolution if the prediction is active
    if (pred.active)
      return interaction.reply({ content: `⚠️ Prediction is ongoing. Use \`/stop\` before resolving.`, ephemeral: true })

    // Buttons
    const row = new MessageActionRow()
                    .addComponents(resolve_blue.button.setLabel(pred.opt1))
                    .addComponents(resolve_orange.button.setLabel(pred.opt2))
                    .addComponents(resolve_coin.button);

    return interaction.reply({content: `🔮 ${pred.title} - Who is the winner?`, components: [row], ephemeral: true });
	}
};