"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const PredictionTracker = require('../structures/PredictionTracker');
const RedisHandler = require('../structures/RedisHandler');
const TimerTracker = require('../structures/TimerTracker');
const Utils = require('../structures/Utils');
const { claim_amount } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
            .setName('claim')
            .setDescription('Claim points if you don\'t have any'),

  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction) {
    // Get balance
    const key = `${interaction.guild.id}_${interaction.user.id}`;
    let bal = await RedisHandler.get(interaction.guild.id, interaction.user.id);
    let coin_name = await RedisHandler.coin_name_get(interaction.guild.id);
    
    // Preconditions check
    if (bal > 0) return interaction.reply({ content: '⚠️ Claim when your balance drops to zero', ephemeral: true });

    // If already claimed today, stop claiming
    if (Utils.claimRecord.includes(key)) return interaction.reply({ content: '⚠️ You already claimed today!', ephemeral: true });

    // If amount placed in active prediction, stop claiming
    // Get active prediction from active timer for the guild
    let pred_timer = TimerTracker.get(interaction.guild.id);
    if (pred_timer) {
      let pred = pred_timer.activePrediction;
      const amount = pred.betAmount(interaction.user.id);
      if (amount) return interaction.reply({ content: '⚠️ Wait till your bet ends', ephemeral: true });
    }

    // If amount placed in stale prediction, stop claiming
    // Retrieve list of member IDs with unresolved predictions
    let staleReply = "⚠️ Ask them to announce results and repay you first:\n";
    const staleMembers = await RedisHandler.predlist_get(interaction.guild.id);
    if (staleMembers.length) {
      let totalAmount = 0;
      await Promise.all(staleMembers.map( async staleMemberID => {
        let pred = await PredictionTracker.get(interaction.guild.id, staleMemberID);
        const amount = pred.betAmount(interaction.user.id);
        totalAmount += amount;
        if (amount)
          staleReply += (`<@${staleMemberID}>: Withheld ${amount} ${coin_name} from you in 🔮 ${pred.title}\n`);
      }))

      if (totalAmount) {
        return interaction.reply({ content: staleReply, ephemeral: false });
      }
    }

    // Pay the benefits
    await RedisHandler.incrby(interaction.guild.id, interaction.user.id, claim_amount);
    interaction.reply(`Now you have ${claim_amount} ${coin_name}. Bet wisely!`);

    Utils.claimRecord.push(key); // Record into daily payment array    
  }
}