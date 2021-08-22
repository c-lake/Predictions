const { Guild } = require('discord.js');
const Timer = require('./Timer');

/**
 * Keeps track of timer object for each guild.
 * Each guild may have 0 or 1 timer.
 * Inactive timers should always be unregistered from the tracker.
 */
class TimerTracker {

  /**
   * Creates a timer for a guild if none exists, or returns the existing one.
   * 
   * @param {Guild} guild Guild
   * @param {string} creator_id Creator ID
   * @param {string} title Title of prediction to pass on for constructing prediction
   * @param {string} opt1 Description of the first option to pass on for constructing prediction
   * @param {string} opt2 Description of the second option to pass on for constructing prediction
   * 
   * @returns {Timer} Timer created or requested
   */
  static create(guild, creator_id, title, opt1, opt2) {
    console.log('Create or get timer');
    // console.log(TimerTracker.timers);
    const guild_id = guild.id;
    if (!TimerTracker.timers[guild_id]) {
      TimerTracker.timers[guild_id] = new Timer(guild, creator_id, title, opt1, opt2);
    }
    return TimerTracker.timers[guild_id];
  }

  /**
   * Retrieves the timer for a guild.
   * 
   * @param {string} guild_id Guild ID
   * 
   * @returns {Timer} Timer requested. Null if does not exist
   */
  static get(guild_id) {
    console.log('Get timer');
    // console.log(TimerTracker.timers);
    return TimerTracker.timers[guild_id];
  }

  /**
   * Unregisters the timer for a guild.
   * 
   * @param {string} guild_id Guild ID
   */
  static purge(guild_id) {
    console.log('Purge timer');
    delete TimerTracker.timers[guild_id];
  }
}

TimerTracker.timers = {};

module.exports = TimerTracker