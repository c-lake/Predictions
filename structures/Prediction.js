const Discord = require('discord.js');
const RedisHandler = require('./RedisHandler');
const { prefix, gain_multipler } = require('../config.json');

/**
 * Stores the details of a prediction.
 * A prediction is exactly associated with one member of a guild. (1 to 1 relationship)
 */
class Prediction {
  /**
   * Constructs a new prediction object, or restores a prediction from remote.
   * 
   * @param {string} title Title of prediction
   * @param {string} opt1 Description of the first option
   * @param {string} opt2 Description of the second option
   * @param {string} guild_id Guild ID
   * @param {string} creator_id User ID of the creator
   * 
   * The below params are only required when restoring a saved prediction from Redis (after bot restart).
   * @param {boolean} active Whether or not prediction is active in a guild
   *  A guild only has one active prediction (when it is associated with activePrediction in the guild timer)
   * @param {object} bets The record of bets on the prediction
   * @param {number} gain The initial incentive bet on the prediction by the bot.
   * @param {number} timestamp Creation time of prediction.
   * 
   * Calculation of gain: (number of participants in the last bet of guild - 1) * gain multiplier
   * Min capped at 0, cannot be negative (when there are no participants in the last bet)
   */
  constructor(title, opt1, opt2, guild_id, creator_id, active = true, bets = {}, gain = -1, timestamp = Date.now()) {
    this.title = title;
    this.opt1 = opt1;
    this.opt2 = opt2;
    this.guild_id = guild_id;
    this.creator_id = creator_id;
    this.active = active;
    this.bets = bets;
    this.gain = gain;
    this.timestamp = timestamp;

    // If gain is not initialized (which means that it is not from a previously saved prediction),
    // initialize it now.
    if (this.gain == -1) this.initGain();
  }
  
  /**
   * Initializes the gain, incentive bet by the bot.
   */
  async initGain() {
    const remote_gain = await RedisHandler.gain_get(this.guild_id);
    this.gain = (remote_gain ? remote_gain : 0) * gain_multipler;
  }

  /**
   * Bets on the prediction.
   * 
   * @param {string} creator_id Creator ID
   * @param {number} opt Option chosen. Should be either 1 or 2
   * @param {number} amount Points placed in the bet
   * @returns {Promise<number>} Result state: 0 - OK, -1 - Insufficient balance, -2 - Chosen another option
   */
  async bet(creator_id, opt, amount) {
    // Check opt
    if (opt != 1 && opt != 2) throw Error('Resolution option incorrect.');

    // Check balance
    let balance = await RedisHandler.get(this.guild_id, creator_id);
    if (amount > balance) // If amount exceeds balance
      return -1; // Insufficient balance
    
    if (!this.bets[creator_id]) // If never placed bet before
      this.bets[creator_id] = { opt, amount: 0};

    if (this.bets[creator_id].opt != opt) // If previously placed bet, but option is different
      return -2; // Chosen another option
    
    await RedisHandler.incrby(this.guild_id, creator_id, -amount);
    this.bets[creator_id].amount += amount;

    return 0; // OK
  }

  /**
   * Provides current bet statistics. 
   *
   * @returns {Promise<Discord.MessageEmbed>} Embed containing the statistics
   */
  async info() {
    const coin_name = await RedisHandler.coin_name_get(this.guild_id);
    let opt1_points = Object.values(this.bets).filter(rec => rec.opt == 1).reduce( (ax, rec)=> {
      return ax += rec.amount;
    }, 0) + this.gain;
    let opt2_points = Object.values(this.bets).filter(rec => rec.opt == 2).reduce( (ax, rec)=> {
      return ax += rec.amount;
    }, 0) + this.gain;
    let opt1_odds = opt1_points ? '1:' + parseFloat(((opt1_points + opt2_points) / opt1_points).toFixed(2)) : 'N/A';
    let opt2_odds = opt2_points ? '1:' + parseFloat(((opt1_points + opt2_points) / opt2_points).toFixed(2)) : 'N/A';
    let stats = [
      {
        points: opt1_points,
        odds: opt1_odds,
        users: Object.values(this.bets).filter(rec => rec.opt == 1).length,
        maxPoints: opt1_points - this.gain ? Math.max(...Object.values(this.bets).filter(rec => rec.opt == 1).map( rec => rec.amount )) : 0
      },
      {
        points: opt2_points,
        odds: opt2_odds,
        users: Object.values(this.bets).filter(rec => rec.opt == 2).length,
        maxPoints: opt2_points - this.gain ? Math.max(...Object.values(this.bets).filter(rec => rec.opt == 2).map( rec => rec.amount )) : 0
      }
    ]
    const embed = new Discord.MessageEmbed()
      // Set the title of the field
      .setTitle((this.active ? '' : '[Closed] ') + this.title)
      // Set the color of the embed
      .setColor(0xf5019b)
      // Set the main content of the embed
      .setDescription(this.active ? `Cast your vote and win ${coin_name}！` : 'Submissions closed')
      .addFields(
        { name: `🔷 ${this.opt1}`, value: (this.active ? `\`/bet 1 <${coin_name}>\`\n` : `\`/resolve\` with 🔷\n`) + `🔮 ${stats[0].points}\n🏆 ${stats[0].odds}\n🧙 ${stats[0].users}\n🥇 ${stats[0].maxPoints}`, inline: true},
        { name: `🔶 ${this.opt2}`, value: (this.active ? `\`/bet 2 <${coin_name}>\`\n` : `\`/resolve\` with 🔶\n`) + `🔮 ${stats[1].points}\n🏆 ${stats[1].odds}\n🧙 ${stats[1].users}\n🥇 ${stats[1].maxPoints}`, inline: true},
      )
      .setTimestamp();
    
    return embed;
  }

  /**
   * 
   */
  betAmount(author_id) {
    return (author_id in this.bets ? this.bets[author_id].amount : 0);
  }

  /**
   * Releases results and rewards for prediction.
   * 
   * @param {Discord.Guild} guild Guild object to find winner
   * @param {number} opt The result option. Should be either 1 or 2
   * 
   * @returns {Promise<Discord.MessageEmbed>} Embed containing the results
   */
  async resolve(guild, opt) {
    // Forbid resolution of active prediction
    if (this.active) throw Error(`Prediction ${this.title} active, resolution not allowed.`);
    // Check opt
    if (opt != 1 && opt != 2) throw Error('Resolution option incorrect.');

    const coin_name = await RedisHandler.coin_name_get(this.guild_id);
    const opt1_points = Object.values(this.bets).filter(rec => rec.opt == 1).reduce( (ax, rec)=> {
      return ax += rec.amount;
    }, 0) + this.gain; // Includes gain (treating incentive bet as real player that would share the losing option's bets)
    const opt2_points = Object.values(this.bets).filter(rec => rec.opt == 2).reduce( (ax, rec)=> {
      return ax += rec.amount;
    }, 0) + this.gain; // Includes gain
    const num_winners = Object.values(this.bets).filter(rec => rec.opt == opt).length;

    // If nobody won
    if (num_winners == 0) {
      return new Discord.MessageEmbed()
      // Set the title of the field
      .setTitle(this.title)
      // Set the color of the embed
      .setColor(opt == 1 ? 0x2aadf4 : 0xff8b00)
      // Set the main content of the embed
      .setDescription('Rewards incoming')
      .addFields({ name: `${opt == 1 ? '🔷' : '🔶'} ${opt == 1 ? this.opt1 : this.opt2}`, value: 'Nobody won..'})
      .setTimestamp();
    }

    const max_winner_points = Math.max(...Object.values(this.bets).filter(rec => rec.opt == opt).map( rec => rec.amount ));
    const max_winner_id = Object.keys(this.bets).find(key => this.bets[key].amount === max_winner_points && this.bets[key].opt == opt);
    let max_winner_name = 'Unknown member'; 
    try {
      max_winner_name = (await guild.members.fetch(max_winner_id)).toString();
    }
    catch(e) {
      console.log('e');
    }

    // Return money to winners
    // First calculate odds
    const odds = (opt1_points + opt2_points) / (opt == 1 ? opt1_points : opt2_points);
    // Write back to redis
    await Promise.all(Object.entries(this.bets).map(async ([key, value]) => {
      if (value.opt != opt) return;
      await RedisHandler.incrby(this.guild_id, key, Math.round(value.amount * odds));
    }))
    
    // Return info embed
    const embed = new Discord.MessageEmbed()
      // Set the title of the field
      .setTitle(this.title)
      // Set the color of the embed
      .setColor(opt == 1 ? 0x2aadf4 : 0xff8b00)
      // Set the main content of the embed
      .setDescription('Rewards incoming')
      .addFields({ name: `${opt == 1 ? '🔷' : '🔶'} ${opt == 1 ? this.opt1 : this.opt2}`, value: `${max_winner_name} ${num_winners - 1 ? 'and ' + (num_winners - 1) + ' other' + (num_winners - 2 ? 's' : '') : ''} won ${Math.round(((opt == 1 ? opt1_points : opt2_points) - this.gain) * odds)} ${coin_name}!`, inline: true})
      .setTimestamp();

    return embed;
  }

  /**
   * Refunds for all bets on the prediction.
   */
  async refund() {
    // Forbid refund of active prediction
    if (this.active) throw Error(`Prediction ${this.title} active, refund not allowed.`);

    await Promise.all(Object.entries(this.bets).map(async ([key, value]) => {
      await RedisHandler.incrby(this.guild_id, key, value.amount);
    }));
  }

  /**
   * Save prediction to remote.
   * This occurs after prediction goes inactive (timer has stopped).
   * This enables prediction to be persistent even after bot restart.
   */
  async save() {
    console.log('Save pred');
    await RedisHandler.pred_set(this.guild_id, this.creator_id, JSON.stringify(this));
    const gain = Math.max((Object.values(this.bets).length - 1), 0);
    await RedisHandler.gain_set(this.guild_id, gain);
  }
}

module.exports = Prediction;