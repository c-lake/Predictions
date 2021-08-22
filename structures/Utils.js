const Discord = require('discord.js');

/**
 * Miscellaneous utilities.
 */
class Utils {

  /**
   * Resets the claim record every day.
   * A member can claim game points every day if he has 0 balance.
   */
  static async claimResetDaily() {
    while (1) {
      Utils.claimRecord = [];
      console.log('Reset claim record')
      await Utils.claimTimer();
    }
  }
  
  /**
   * Timer for resetting claim record.
   * 
   * @returns {Promise} A promise that resolves at midnight on the next day
   */
  static claimTimer() {
    const time = Utils.msTillMidnight();
    console.log(`Set timer: ${time+100} ms until claim record reset`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('1');
      }, time+100);
    })
  }
  
  /**
   * Calculates the time until midnight on the next day.
   * 
   * @returns {number} Milliseconds until midnight
   */
  static msTillMidnight() {
    let now = new Date();
    let night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // the next day, ...
      0, 0, 0 // ...at 00:00:00 hours
      );
      return night.getTime() - now.getTime();
  }
  
  /**
   * Checks if a member is an administrator in the guild.
   * 
   * @param {Discord.Interaction} interaction Interaction / Message for extracting the member ID
   * 
   * @returns {Boolean} Whether member is an administrator
   */
  static checkAdmin(interaction) {
    return interaction.member.permissions.has('ADMINISTRATOR');
  }

  /**
   * Formats seconds to M:SS.
   * 
   * @param {number} s Number of seconds
   * 
   * @returns {string} Formatted time
   */
  static secondsToMSS(s) {
    return(s-(s%=60))/60+(9<s?':':':0')+s
  }
}

// Static claim record
Utils.claimRecord = [];

module.exports = Utils;