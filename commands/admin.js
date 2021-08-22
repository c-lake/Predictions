"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, CommandInteraction } = require('discord.js');
const notify_stale = require('../buttons/notify_stale');
const refund_stale = require('../buttons/refund_stale');
const PredictionTracker = require('../structures/PredictionTracker');
const RedisHandler = require('../structures/RedisHandler');
const Utils = require('../structures/Utils');

module.exports = {
  data: new SlashCommandBuilder()
            .setName('admin')
            .setDescription('Administrative commands.')
            .addSubcommand(subcommmand => 
              subcommmand
                .setName('coinname')
                .setDescription('Set display name of coin')
                .addStringOption(option => 
                  option.setName('name')
                        .setDescription('Display name')
                        .setRequired(true)
                )
            )
            .addSubcommand(subcommmand => 
              subcommmand
              .setName('stale')
              .setDescription('List and choose to refund unresolved predictions')
            ),
    
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();

      // Check admin permissions
      if (!Utils.checkAdmin(interaction))
        return interaction.reply({ content: '⚠️ You do not have permissions to do this', ephemeral: true });

      if (subcommand == "coinname") {
        // Parse args
        let coin_name = interaction.options.getString('name');

        // Limit length of coin name
        coin_name = coin_name.substr(0, 30);

        // Set coin name in Redis
        await RedisHandler.coin_name_set(interaction.guild.id, coin_name);
        return interaction.reply({ content: '✅ Completed' });
      }

      if (subcommand == "stale") {
        // Retrieve list of member IDs with unresolved predictions
        const staleMembers = await RedisHandler.predlist_get(interaction.guild.id);

        // If no unresolved predictions
        if (!staleMembers.length) return interaction.reply('No unresolved predictions in guild!');

        await interaction.reply('List of unresolved predictions:');
        staleMembers.map( async staleMemberID => {
          let pred = await PredictionTracker.get(interaction.guild.id, staleMemberID);
          let embed = await pred.info();

          // Buttons
          const row = new MessageActionRow()
                          .addComponents(refund_stale.button);

          // Fetch user (globally), in case user has been removed
          let user = null;
          try {
            user = await interaction.client.users.fetch(staleMemberID);
          }
          catch (error) {
            embed.setAuthor(`Deleted account ${staleMemberID} created`)
            return interaction.channel.send({ embeds: [embed], components: [row] });
          }

          // Fetch member (in guild), in case member has been removed from guild
          let member = null;
          try {
            member = await interaction.guild.members.fetch(user);
          }
          catch (error) {
            embed.setAuthor(user.username + " (removed from guild) created", user.avatarURL());
            return interaction.channel.send({ embeds: [embed], components: [row] });
          }

          embed.setAuthor(member.displayName + " created", user.avatarURL())
               .setFooter("Creation time")
               .setTimestamp(pred.timestamp);
          const rowNotify = new MessageActionRow()
                                .addComponents(notify_stale.button.setLabel(`Remind ${member.displayName}`))
                                .addComponents(refund_stale.button)
          interaction.channel.send({ embeds: [embed], components: [rowNotify] });
        })
      }
    }
}