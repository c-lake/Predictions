"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageActionRow } = require('discord.js');
const cancel_refund = require('../buttons/cancel_refund');
const confirm_refund = require('../buttons/confirm_refund');
const PredictionTracker = require('../structures/PredictionTracker');

module.exports = {
	data: new SlashCommandBuilder()
            .setName('refund')
            .setDescription('Cancel your prediction and refund everyone'),
        
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

    const embed = (await pred.info())
                  .setAuthor(`${interaction.member.displayName}, are you sure you want to cancel the bet and refund everyone?`, interaction.user.avatarURL());

    // Buttons
    const row = new MessageActionRow()
                    .addComponents(cancel_refund.button)
                    .addComponents(confirm_refund.button);

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
	}
};