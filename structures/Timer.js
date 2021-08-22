const { Guild } = require('discord.js');
const BetMessageClickTracker = require('./BetMessageClickTracker');
const { timer_update_interval } = require('../config.json');
const PredictionTracker = require('./PredictionTracker');
const Utils = require('./Utils')

/**
 * A prediction timer setting the nickname to display the time.
 * Also tracks the active prediction for the guild.
 */
class Timer {
  /**
   * Constructs a new timer object, and also registers a new prediction object.
   * 
   * @param {Guild} guild Guild for extracting permissions
   * @param {string} creator_id Creator ID
   * @param {string} title Title of prediction
   * @param {string} opt1 Description of the first option
   * @param {string} opt2 Description of the second option
   */
  constructor(guild, creator_id, title, opt1, opt2) {
    this.guild = guild;
    this.running = false;
    this.activePrediction = PredictionTracker.create(guild.id, creator_id, title, opt1, opt2);
    /** @type {NodeJS.Timer} */
    this.timerHandle = null;
    this.count = 0;
  }

  /**
   * Starts the countdown.
   * 
   * @param {number} time Time for countdown. Must be multiple of timer_update_interval
   * @param {Function} callback Function to call when timer completes
   */
  start(time, callback) {
    // Check initial conditions
    if (time % timer_update_interval != 0)
      throw Error(`Time should be multiple of ${timer_update_interval}`);

    if (this.running)
      throw Error(`Timer already running`);
    
    // Prepare timer
    this.running = true;

    this.count = time / timer_update_interval // Number of activity updates
    console.log(`Countdown: ${this.count} intervals`)

    // Start countdown
    if (this.guild.me.permissions.has('CHANGE_NICKNAME'))
      this.guild.me.setNickname(`Predictions - ${Utils.secondsToMSS(this.count * timer_update_interval)} remaining`);
    this.count--;
    this.timerHandle = setInterval( () => {
      // Stop when countdown ends
      if (this.count == 0) {
        this.stop();
        callback(); // Run callback function
      }
      // Continue countdown
      else {
        if (this.guild.me.permissions.has('CHANGE_NICKNAME'))
          this.guild.me.setNickname(`Predictions - ${Utils.secondsToMSS(this.count * timer_update_interval)} remaining`);
        this.count--;
      }
    }, timer_update_interval * 1000);
  }

  /**
   * Extends the countdown.
   * 
   * @param {number} time Time to be extended. Must be multiple of timer_update_interval
   * @returns {number} Actual time (s) extended. Timer is capped at 300 s / 5 min.
   */
  extend(time) {
    // Check initial conditions
    if (time % timer_update_interval != 0)
    throw Error(`Time should be multiple of ${timer_update_interval}`);
  
    const currentCount = this.count;
    const newCount = Math.min(time / timer_update_interval + currentCount, 300 / timer_update_interval);
    this.count = newCount;

    console.log(`Countdown extended by ${newCount - currentCount} intervals: ${this.count} intervals remained`)
    return (newCount - currentCount) * timer_update_interval;
  }

  /**
   * Stops the timer. Also deactivates and saves the active prediction.
   */
  stop() {
    clearInterval(this.timerHandle);
    if (this.guild.me.permissions.has('CHANGE_NICKNAME'))
      this.guild.me.setNickname('');
    this.running = false;
    this.activePrediction.active = false;
    this.activePrediction.save();

    // Clear all bet messages tracked
    BetMessageClickTracker.destroy(this.guild.id);
  }
}

module.exports = Timer;