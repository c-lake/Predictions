/**
 * Tracks /bet and click for bet buttons e.g. "🔷 10", "🔶 100" in a message.
 * For the purpose of showing bet statistics of the message in embed, e.g. "user and 2 others chipped in 12345 points."
 */
class BetMessageClickTracker {

  /**
   * Retrieves statistics on bet message.
   * 
   * @param {string} guild_id Guild ID
   * @param {string} message_id Message ID
   * @returns {{ users: number, opt: number, amount: number }} Number of users bet on the message, the common option (-1 if there is no common option) by users, the total bet amount on message
   */
  static query(guild_id, message_id) {
    const message = Object.assign({}, BetMessageClickTracker.guilds[guild_id][message_id]);
    const opt = message['uniform_option'];
    delete message['uniform_option'];

    const messageArr = Object.entries(message);
    return {
      'users': messageArr.length, // -1 for uniform option. Too lazy to use Map. Computational time similar until ~100K records.
      opt,
      'amount': messageArr.reduce( (ax, obj) => ( ax + obj[1]["amount"] ), 0) // Sum amount from entries in format [ 'user_id', { opt: 1, amount: 20 } ] 
    }
  }

  /**
   * Track a message that has bet buttons.
   * 
   * @param {string} guild_id 
   * @param {string} message_id 
   */
  static trackMessage(guild_id, message_id) {
    // If guild not tracked yet
    if (!BetMessageClickTracker.guilds[guild_id])
      BetMessageClickTracker.guilds[guild_id] = {}
    
    const guild = BetMessageClickTracker.guilds[guild_id];
    
    // If message not tracked yet
    if (!guild[message_id])
      guild[message_id] = {'uniform_option': null} // uniform_option: whether all bets on the message are for the same option  

    return guild[message_id]
  }

  /**
   * Check whether a message is currently being tracked.
   * If false, the message might have expired (e.g. for an older prediction).
   * 
   * @param {string} guild_id 
   * @param {string} message_id 
   * @returns {boolean}
   */
  static invalidateMessage(guild_id, message_id) {
    // Whole guild untracked yet. Theoretically not possible (as tracked at start)
    if (!BetMessageClickTracker.guilds[guild_id]) return false;

    return (!!BetMessageClickTracker.guilds[guild_id][message_id]);
  }

  /**
   * Tracks /bet and clicks on bet buttons.
   * 
   * @param {string} guild_id Guild ID
   * @param {string} message_id Message ID
   * @param {string} user_id ID of user who placed bet
   * @param {number} opt Option
   * @param {number} amount Amount
   */
  static trackClick(guild_id, message_id, user_id, opt, amount) {
    const message = BetMessageClickTracker.trackMessage(guild_id, message_id);

    // If first bet of message, initialize uniform option
    if (!message['uniform_option'])
      message['uniform_option'] = opt;

    if (message['uniform_option'] != opt)
      message['uniform_option'] = -1; // Bets are no longer the towards the same option. Flag uniform_option as -1
    
    // If user who placed bet not tracked yet
    if (!message[user_id])
      return message[user_id] = {opt, amount};
    
    // If already tracked, simply add amount
    // Conflicting options should have been handled in Prediction.js
    message[user_id]['amount'] += amount;
  }

  /**
   * Removes all tracked messages for a guild.
   * For use when prediction of guild ends (timeout / early stop).
   * 
   * @param {string} guild_id Guild ID
   */
  static destroy(guild_id) {
    delete BetMessageClickTracker.guilds[guild_id];
  }

}

BetMessageClickTracker.guilds = {}
/**
 * Structure
 * {
 *   "guild_id": {
 *     "message_id": {
 *       "creator_id123": {"opt": 1, amount: 123},
 *       "creator_id456": {"opt": 2, amount: 1234},
 *     }
 *   }
 * }
 */

module.exports = BetMessageClickTracker;