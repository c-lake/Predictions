"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, CommandInteraction } = require('discord.js');
const BetMessageClickTracker = require('../structures/BetMessageClickTracker');
const bet_blue_10 = require('../buttons/bet_blue_10');
const bet_blue_100 = require('../buttons/bet_blue_100');
const bet_orange_10 = require('../buttons/bet_orange_10');
const bet_orange_100 = require('../buttons/bet_orange_100');
const RedisHandler = require('../structures/RedisHandler');
const TimerTracker = require('../structures/TimerTracker');

module.exports = {
  data: new SlashCommandBuilder()
            .setName('bet')
            .setDescription('Bet on prediction')
            .addStringOption(option => 
              option.setName('opt')
                    .setDescription('Option to bet on: 1 for 🔷, 2 for 🔶')
                    .addChoices([
                      ["1 - Blue", "1"],
                      ["2 - Orange", "2"]
                    ])
                    .setRequired(true)
            )
            .addIntegerOption(option => 
              option.setName('amount')
                    .setDescription('Amount to chip in')
                    .setRequired(true)
            ),
  
  /**
  * 
  * @param {CommandInteraction} interaction 
  */
  async execute(interaction) {
    // Parse args
    const opt = parseInt(interaction.options.getString('opt'));
    const amount = interaction.options.getInteger('amount');

    // If input invalid
    if (amount <= 0)
      return interaction.reply({ content: '⚠️ At least bet with 1 point', ephemeral: true });
    
    // Get active prediction from active timer for the guild
    let pred_timer = TimerTracker.get(interaction.guild.id);
    if (!pred_timer)
      return interaction.reply({ content: '⚠️ No active prediction!', ephemeral: true }); // If no active prediction

    let pred = pred_timer.activePrediction;

    // Place bet on the prediction
    let actions = await Promise.all([
      pred.bet(interaction.user.id, opt, amount),
      RedisHandler.coin_name_get(interaction.guild.id)
    ]);

    const betResult = actions[0];
    if (betResult == -1)
      return interaction.reply({ content: '⚠️ You do not have enough money!', ephemeral: true });
    if (betResult == -2)
      return interaction.reply({ content: '⚠️ You cannot change sides!', ephemeral: true });

    const coin_name = actions[1];
    
    // Send information embed
    let embed = (await pred.info())
                .setAuthor(interaction.member.displayName + ` chipped in ${amount} ${coin_name} to ${opt == 1 ? `🔷 ${pred.opt1}` : `🔶 ${pred.opt2}`}`, interaction.user.avatarURL());

    const betButtonsRow = new MessageActionRow()
                              .addComponents(bet_blue_10.button)
                              .addComponents(bet_blue_100.button)
                              .addComponents(bet_orange_10.button)
                              .addComponents(bet_orange_100.button);

    await interaction.reply({ embeds: [embed], components: [betButtonsRow] });

    BetMessageClickTracker.trackClick(interaction.guild.id, (await interaction.fetchReply()).id, interaction.user.id, opt, amount);
  }
}