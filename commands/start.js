"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageActionRow } = require('discord.js');
const BetMessageClickTracker = require('../structures/BetMessageClickTracker');
const bet_blue_10 = require('../buttons/bet_blue_10');
const bet_blue_100 = require('../buttons/bet_blue_100');
const bet_orange_10 = require('../buttons/bet_orange_10');
const bet_orange_100 = require('../buttons/bet_orange_100');
const { timer_update_interval } = require('../config.json');
const PredictionTracker = require('../structures/PredictionTracker');
const TimerTracker = require('../structures/TimerTracker');

module.exports = {
	data: new SlashCommandBuilder()
            .setName('start')
            .setDescription('Create a new prediction')
            .addStringOption(option => 
              option.setName('title')
                    .setDescription('Title of prediction')
                    .setRequired(true)
            )
            .addStringOption(option => 
              option.setName('opt1')
                    .setDescription('1st option of prediction')
                    .setRequired(true)
            )
            .addStringOption(option => 
              option.setName('opt2')
                    .setDescription('2nd option of prediction')
                    .setRequired(true)
            )
            .addIntegerOption(option => 
              option.setName('countdown')
                    .setDescription(`Countdown time in seconds. Must be a multiple of ${timer_update_interval} smaller than 300.`)
                    .setRequired(true)
            ),
        
  /**
   * 
   * @param {CommandInteraction} interaction 
   * @returns 
   */         
  async execute(interaction) {
    // Parse args
    const title = interaction.options.getString('title');
    const opt1 = interaction.options.getString('opt1');
    const opt2 = interaction.options.getString('opt2');
    const time = interaction.options.getInteger('countdown');
    
    // Input & preconditions check
    // If time invalid
    if (time % timer_update_interval || time <= 0 || time > 300)
      return interaction.reply({ content: `⚠️ Countdown time must be positive multiple of ${timer_update_interval} smaller than 300.`, ephemeral: true });
    
    // Check if user has unresolved prediction
    let prev_prediction = await PredictionTracker.get(interaction.guild.id, interaction.user.id);
    if (prev_prediction)
      return interaction.reply({ content: `⚠️ You have unresolved prediction: ${prev_prediction.title} - Resolve it first!`, ephemeral: true});

    // Try to create timer for the guild
    let pred_timer = TimerTracker.create(interaction.guild, interaction.user.id, title.substr(0, 60), opt1.substr(0, 30), opt2.substr(0, 30));
    // If there is existing timer for the guild, TimerTracker will return the existing one instead of creating a new one.
    // Note: length of title and name of options are limited to 60 and 30 chars
    
    // If guild has active prediction
    if (pred_timer.running)
      return interaction.reply({ content: '⚠️ Cannot create new prediction as there is one is ongoing', ephemeral: true });
    
    // Start prediction
    pred_timer.start(time, () => {
      interaction.followUp('⏰ Times up');
      TimerTracker.purge(interaction.guild.id);
    });

    // Send information embed
    let embed = (await pred_timer.activePrediction.info())
                .setAuthor(interaction.member.displayName + " started new prediction", interaction.user.avatarURL());

    const betButtonsRow = new MessageActionRow()
                              .addComponents(bet_blue_10.button)
                              .addComponents(bet_blue_100.button)
                              .addComponents(bet_orange_10.button)
                              .addComponents(bet_orange_100.button);

    await interaction.reply({ embeds: [embed], components: [betButtonsRow] });

    // Track message
    BetMessageClickTracker.trackMessage(interaction.guild.id, (await interaction.fetchReply()).id);
	}
};