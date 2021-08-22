"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const TimerTracker = require('../structures/TimerTracker');
const Utils = require('../structures/Utils');

module.exports = {
  data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('End active prediction'),
  
  /**
  * 
  * @param {CommandInteraction} interaction 
  */
  async execute(interaction) {
    // Get active timer for the guild
    let pred_timer = TimerTracker.get(interaction.guild.id);
    if (!pred_timer)
      return interaction.reply({ content: '⚠️ No active prediction!', ephemeral: true }) // If no active prediction
    
    // Check admin permissions / creator
    if (!Utils.checkAdmin(interaction) && interaction.user.id != pred_timer.activePrediction.creator_id)
      return interaction.reply({ content: '⚠️ You must be administrator or creator of prediction to stop', ephemeral: true });
    
    // Stop the timer and unregister it from TimerTracker
    const prediction_stopped = pred_timer.activePrediction;
    pred_timer.stop();
    TimerTracker.purge(interaction.guild.id);
    
    const endEmbed = (await prediction_stopped.info())
                      .setAuthor(interaction.member.displayName + " ended prediction early", interaction.user.avatarURL());
    
    interaction.reply({ embeds: [endEmbed] });
  }
}
