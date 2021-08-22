const Prediction = require('./Prediction');
const RedisHandler = require('./RedisHandler');

/**
 * Keeps track of prediction object for each member of a guild.
 * Each guild has one active prediction.
 * Each member of a guild has one prediction.
 */
class PredictionTracker {

  /**
   * Create a prediction for a member if none exists, or returns the existing one.
   * 
   * @param {string} guild_id Guild ID of prediction
   * @param {string} creator_id Creator ID of prediction
   * @param {string} title Title of prediction
   * @param {string} opt1 Description of the first option
   * @param {string} opt2 Description of the second option
   * 
   * @returns {Prediction} Prediction created or requested
   */
  static create(guild_id, creator_id, title, opt1, opt2) {
    console.log('Create pred');
    const pred_key = `${guild_id}_${creator_id}`;

    // If the member does not have predictions, create a new one.
    if (!PredictionTracker.predictions[pred_key]) {
      PredictionTracker.predictions[pred_key] = new Prediction(title, opt1, opt2, guild_id, creator_id);
    }

    console.log(PredictionTracker.predictions);
    return PredictionTracker.predictions[pred_key];
  }

  /**
   * Restores a previously saved prediction object and loads it into the local tracker.
   * 
   * @param {object} remote_obj Previously saved prediction object on Redis
   * 
   * @returns {Prediction} Prediction restored
   */
  static createFromRemote(remote_obj) {
    console.log('Create pred from remote');
    const guild_id = remote_obj.guild_id;
    const creator_id = remote_obj.creator_id;
    const pred_key = `${guild_id}_${creator_id}`;

    // Create and save into local tracker
    PredictionTracker.predictions[pred_key] = new Prediction(remote_obj.title, remote_obj.opt1, remote_obj.opt2, guild_id, creator_id, remote_obj.active, remote_obj.bets, remote_obj.gain, remote_obj.timestamp);
    // console.log(PredictionTracker.predictions);
    return PredictionTracker.predictions[pred_key];
  }

  /**
   * Retrieves the prediction for a member.
   * 
   * @param {String} guild_id Guild ID
   * @param {string} creator_id Creator ID
   * 
   * @returns {Promise<Prediction>} Prediction requested
   */
  static async get(guild_id, creator_id) {
    console.log('Get pred');
    const pred_key = `${guild_id}_${creator_id}`;

    let local_pred = PredictionTracker.predictions[pred_key];
    if (local_pred) return local_pred;

    // If not found locally, get remote copy
    const remote_pred_json = await RedisHandler.pred_get(guild_id, creator_id);
    if (!remote_pred_json) return null; // If also not found remotely, no prediction exists for member.

    // Reload the remote copy
    let remote_pred_obj = JSON.parse(remote_pred_json);

    // Return the reloaded local copy
    return PredictionTracker.createFromRemote(remote_pred_obj);
  }

  /**
   * Unregister the prediction for a member.
   * 
   * @param {String} guild_id Guild ID
   * @param {String} creator_id Creator ID
   */
  static async purge(guild_id, creator_id) {
    console.log('Purge pred');
    const pred_key = `${guild_id}_${creator_id}`
    delete PredictionTracker.predictions[pred_key];
    // console.log(PredictionTracker.predictions);

    // Delete remote copy
    await RedisHandler.pred_unset(guild_id, creator_id);
  }
}

PredictionTracker.predictions = {};

module.exports = PredictionTracker;