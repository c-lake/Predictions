"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const { timer_update_interval } = require('../config.json');
const TimerTracker = require('../structures/TimerTracker');

module.exports = {
  data: new SlashCommandBuilder()
            .setName('extend')
            .setDescription('Extend timer for your active prediction')
            .addIntegerOption(option => 
              option.setName('countdown')
                    .setDescription(`Extra countdown time in seconds. Must be a multiple of ${timer_update_interval} smaller than 300.`)
                    .setRequired(true)
            ),
  
  /**
  * 
  * @param {CommandInteraction} interaction 
  * @returns 
  */         
  async execute(interaction) {
    // Parse args
    const time = interaction.options.getInteger('countdown');
    
    // Input & preconditions check
    // If time invalid
    if (time % timer_update_interval || time <= 0 || time > 300)
      return interaction.reply({ content: `⚠️ Countdown time must be positive multiple of ${timer_update_interval} smaller than 300.`, ephemeral: true });

    // Retrieve active timer
    const timer = TimerTracker.get(interaction.guild.id);
    // If no active prediction
    if (!timer || !timer.running)
      return interaction.reply({ content: `⚠️ No active prediction!`, ephemeral: true });
    
    // If caller is not creator of active prediction
    if (timer.activePrediction.creator_id != interaction.user.id)
      return interaction.reply({ content: `⚠️ You must be creator of prediction to extend it.`, ephemeral: true });

    const extended = timer.extend(time);
    return interaction.reply(`✅ Extended timer for prediction 🔮 ${timer.activePrediction.title} by ${extended} s. ${ (extended != time ? 'Timer is limited to 300 s.' : '') }`);
  }
}