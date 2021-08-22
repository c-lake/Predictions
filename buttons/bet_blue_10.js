"use strict";
const { ButtonInteraction, MessageButton } = require("discord.js");
const BetMessageClickTracker = require("../structures/BetMessageClickTracker");
const RedisHandler = require("../structures/RedisHandler");
const TimerTracker = require("../structures/TimerTracker");

// Bet button. Shown in prediction embed from /start and /bet
module.exports = {
  button: new MessageButton()
              .setCustomId('bet_blue_10')
              .setEmoji('🔷')
              .setLabel('10')
              .setStyle('SECONDARY'),
  /**
  * 
  * @param {ButtonInteraction} interaction 
  */
  async execute(interaction, opt=1, amount=10) {
    // Get active prediction from active timer for the guild
    let pred_timer = TimerTracker.get(interaction.guild.id);
    if (!pred_timer)
      return interaction.reply({ content: '⚠️ No active prediction!', ephemeral: true }); // If no active prediction

    // If bet buttons already expired (buttons in message for an older prediction)
    if (!BetMessageClickTracker.invalidateMessage(interaction.guild.id, interaction.message.id))
      return interaction.reply({ content: '⚠️ This prediction has already ended.', ephemeral: true });

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

    // Track click
    BetMessageClickTracker.trackClick(interaction.guild.id, interaction.message.id, interaction.user.id, opt, amount);
    
    // Send information embed
    let embed = await pred.info();

    // Generate bet statistics message
    const { users: bet_users, opt: bet_opt, amount: bet_amount } = BetMessageClickTracker.query(interaction.guild.id, interaction.message.id);
    let bet_stat_message = `${interaction.member.displayName} `

    // Case I: Only user here
    if (bet_users == 1)
      bet_stat_message += `chipped in ${bet_amount} ${coin_name} to ${bet_opt == 1 ? `🔷 ${pred.opt1}` : `🔶 ${pred.opt2}`}`

    // Case II: More than one users, but all bet on the same option
    else if (bet_opt != -1)
      bet_stat_message += `and ${bet_users - 1} other${bet_users - 1 > 1 ? "s" : ""} chipped in ${bet_amount} ${coin_name} to ${bet_opt == 1 ? `🔷 ${pred.opt1}` : `🔶 ${pred.opt2}`}`

    // Case III: More than one users with different options
    else
      bet_stat_message += `and ${bet_users - 1} other${bet_users - 1 > 1 ? "s" : ""} chipped in ${bet_amount} ${coin_name}`
    
    embed.setAuthor(bet_stat_message, interaction.user.avatarURL());

    return interaction.update({ embeds: [embed] });
  }
}