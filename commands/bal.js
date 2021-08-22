"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const RedisHandler = require('../structures/RedisHandler');

module.exports = {
  data: new SlashCommandBuilder()
            .setName('bal')
            .setDescription('Check account balance'),
  
  /**
  * 
  * @param {CommandInteraction} interaction 
  * @returns 
  */         
  async execute(interaction) {
    // Retrieve and reply with the current balance 
    let coin_name = await RedisHandler.coin_name_get(interaction.guild.id);
    let bal = await RedisHandler.get(interaction.guild.id, interaction.user.id)
    interaction.reply(`Current balance: ${bal} ${coin_name}`);
  }
}