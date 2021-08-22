const redis = require("redis");
const { promisifyAll } = require('bluebird');
const { redis_host, redis_port } = require("../config.json");

promisifyAll(redis)

/**
* Handles all communication with Redis database.
*/
class RedisHandler {
  /**
  * Retrieves balance of member.
  * 
  * @param {string} guild_id 
  * @param {string} user_id 
  * 
  * @returns {Promise<number>}
  */
  static async get(guild_id, user_id) {
    const key = `${guild_id}_${user_id}_point`;
    return RedisHandler.client.getAsync(key);
  }
  
  /**
  * Sets balance for member.
  * 
  * @param {string} guild_id 
  * @param {string} user_id 
  * @param {number} amount 
  */
  static async incrby(guild_id, user_id, amount) {
    const key = `${guild_id}_${user_id}_point`;
    await RedisHandler.client.incrbyAsync(key, amount);
  }
  
  /**
   * Sets display name for the game points of the guild.
   * 
   * @param {string} guild_id 
   * @param {string} name 
   */
  static async coin_name_set(guild_id, name) {
    const key = `${guild_id}_coinname`;
    await RedisHandler.client.setAsync(key, name);
  }
  
  /**
   * Retrieves display name for the game points of the guild.
   * 
   * @param {string} guild_id 
   * 
   * @returns {Promise<string>}
   */
  static async coin_name_get(guild_id) {
    const key = `${guild_id}_coinname`;
    return RedisHandler.client.getAsync(key);
  }
  
  /**
   * Saves a prediction object for a member.
   * Also registers the prediction to the guild prediction list.
   * 
   * @param {string} guild_id 
   * @param {string} creator_id 
   * @param {string} pred_json Stringified JSON of the prediction object.
   */
  static async pred_set(guild_id, creator_id, pred_json) {
    const key = `${guild_id}_${creator_id}_pred`;
    await RedisHandler.client.setAsync(key, pred_json);
    await RedisHandler.client.saddAsync(`${guild_id}_predlist`, creator_id);
  }
  
  /**
   * Unregisters a prediction object for a member and from the guild prediction list.
   * 
   * @param {string} guild_id 
   * @param {string} creator_id 
   */
  static async pred_unset(guild_id, creator_id) {
    const key = `${guild_id}_${creator_id}_pred`;
    await RedisHandler.client.delAsync(key);
    await RedisHandler.client.sremAsync(`${guild_id}_predlist`, creator_id);
  }
  
  /**
   * Retrieves prediction object (JSON string) for a member.
   * 
   * @param {string} guild_id 
   * @param {string} creator_id 
   * 
   * @returns {Promise<string>}
   */
  static async pred_get(guild_id, creator_id) {
    const key = `${guild_id}_${creator_id}_pred`;
    return RedisHandler.client.getAsync(key);
  }


  /**
   * Retrieves the unresolved prediction list for a guild.
   * 
   * @param {string} guild_id 
   * 
   * @returns {Promise<Array<string>>}
   */
  static async predlist_get(guild_id) {
    return RedisHandler.client.smembersAsync(`${guild_id}_predlist`);
  }
  
  /**
   * Sets the gain constant for a guild.
   * 
   * @param {string} guild_id 
   * @param {number} gain Gain constant
   *  A gain constant is the number of participants in the last prediction of the guild, lower bounded by 0.
   *  See Prediction for the detailed calculation.
   */
  static async gain_set(guild_id, gain) {
    const key = `${guild_id}_gain`;
    await RedisHandler.client.setAsync(key, gain);
  }
  
  /**
   * Retrieves the gain constant for a guild.
   * 
   * @param {string} guild_id 
   * 
   * @returns {Promise<number>}
   */
  static async gain_get(guild_id) {
    const key = `${guild_id}_gain`;
    return RedisHandler.client.getAsync(key);
  }
}

RedisHandler.client = redis.createClient(redis_port, redis_host);

RedisHandler.client.on("error", (error) => {
  console.error('[Redis] ' + error);
});

RedisHandler.client.on("ready", () => {
  console.log(`[Redis] Connected to redis server at ${redis_host}:${redis_port}.`);
});

module.exports = RedisHandler;