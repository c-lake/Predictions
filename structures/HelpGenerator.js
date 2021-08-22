const yaml = require('js-yaml');
const fs = require('fs');
const { MessageEmbed, MessageButton, MessageActionRow, ButtonInteraction } = require('discord.js');

class HelpGenerator {

  /**
   * Load yaml help file as json object.
   */
  static loadDocs() {
    try {
      HelpGenerator.docs = yaml.load(fs.readFileSync('./help.yaml', 'utf8'));
    } catch (e) {
      console.error(`[HelpGenerator] ${e}`);
    }
  }

  /**
   * Generate help embeds and buttons.
   */
  static generate() {
    try {
      HelpGenerator.buttons = []; // Empty existing buttons for LiveReload
      Object.entries(HelpGenerator.docs).map( page => {
        // Generate embed
        const embed = new MessageEmbed()
                          .setAuthor("Predictions • Help", HelpGenerator.avatar_url)
                          .setTitle(`${page[1]['emoji']} ${page[0]}`)
                          .setDescription(page[1]["description"]);
        
        page[1]["fields"].map( field => {
          embed.addField(field["title"], field["content"]);
        });

        // Generate button
        const button = {
          button: new MessageButton()
                           .setCustomId(`help_${page[1]["id"]}`)
                           .setEmoji(page[1]['emoji'])
                           .setLabel(page[0])
                           .setStyle(page[1]['style']),
          
          /**
           * 
           * @param {ButtonInteraction} interaction 
           */
          async execute(interaction) {
            // Find out identity of button
            const page_id = interaction.customId.slice(5);

            // Disable current button
            const row = HelpGenerator.getRow();
            row.components.filter( button => button.customId == interaction.customId )[0].setDisabled(true);

            interaction.update({ embeds: [HelpGenerator.embeds[page_id]], components: [row] });
          }
        }

        HelpGenerator.embeds[page[1]["id"]] = embed;
        HelpGenerator.buttons.push(button)
      })
    } catch (e) {
      console.error(`[HelpGenerator] ${e}`);
    }
  }

  /**
   * Get MessageActionRow populated with help page buttons.
   * 
   * @returns {MessageActionRow}
   */
  static getRow() {
    const help_row = new MessageActionRow();
    HelpGenerator.buttons.map( button => {
      help_row.addComponents(button.button);
    })
    return help_row;
  }
}

HelpGenerator.docs = {};
HelpGenerator.embeds = {};
HelpGenerator.buttons = [];
HelpGenerator.avatar_url = null;

module.exports = HelpGenerator;