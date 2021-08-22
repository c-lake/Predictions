"use strict";
const fs = require('fs');
const Discord = require('discord.js');
const process = require('process');
const { Client, Collection, Intents } = require('discord.js');
const RedisHandler = require('./structures/RedisHandler');
const Utils = require('./structures/Utils');
const { token } = require('./config.json');
const HelpGenerator = require('./structures/HelpGenerator');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.commands = new Collection();
client.buttons = new Collection();

client.login(token).then( () =>
	loadHandlers() // Load handlers involves loading help buttons, requiring avatar URL of bot
);

// Command interaction handler
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;
	if (!client.commands.has(commandName)) return;

	if (!interaction.guild)
		return interaction.reply({ content: '⚠️ Bot is only available in guild.', ephemeral: true });

	// Welcome
	const coin_name = await RedisHandler.coin_name_get(interaction.guild.id);
	if (!coin_name && (commandName != "admin" || interaction.options.getSubcommand() != "coinname")) {
	  const embed = new Discord.MessageEmbed()
		// Set the title of the field
		.setTitle('Welcome to Predictions')
		// Set the color of the embed
		.setColor(0xf5d442)
		// Set the main content of the embed
		.setDescription(`Please first use \`/admin coinname\` to set a display name for the game points.`)
		.addFields(
		  { name: '💬 Getting started and help for commands', value: `\`/help\``},
		)
  
	  interaction.reply({embeds: [embed]});
  
	  if (!interaction.guild.me.permissions.has('CHANGE_NICKNAME'))
		interaction.channel.send('⚠️ Please grant permission for the bot to change its own nickname for the timer to work correctly.')
	  return;
	}
	
	try {
		await client.commands.get(commandName).execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while executing this action!', ephemeral: true })
											.catch( error => {
												console.log(`While handling the above error, another error occurred:\n${error}`)
											});
	}
});

// Button interaction handler
client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
	const { customId } = interaction;
	if (!client.buttons.has(customId)) return;

	try {
		await client.buttons.get(customId).execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
											.catch( error => {
												console.error(`While handling the above error, another error occurred: ${error}`);
											});
	}
});

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	Utils.claimResetDaily();
});

// Live command reload on SIGUSR2
function loadHandlers() {
	// Command handlers
	let reloadedCommands = new Collection();
	let commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	
	for (const file of commandFiles) {
		// Find cached file in require.cache, clean cache
		let cachedFilePath = Object.keys(require.cache).filter( key => key.match(`.*/commands/${file}.*`));
		cachedFilePath.map( path => delete require.cache[path] );
		
		const command = require(`./commands/${file}`);
		reloadedCommands.set(command.data.name, command);
	}
	
	client.commands = reloadedCommands;
	console.log('[LiveReload] Loaded all commands.');

	// Button handlers
	let reloadedButtons = new Collection();
	let buttonFiles = fs.readdirSync('./buttons').filter(file => file.endsWith('.js'));
	
	for (const file of buttonFiles) {
		// Find cached file in require.cache, clean cache
		let cachedFilePath = Object.keys(require.cache).filter( key => key.match(`.*/buttons/${file}.*`));
		cachedFilePath.map( path => delete require.cache[path] );
		
		const button = require(`./buttons/${file}`);
		reloadedButtons.set(button.button.customId, button);
	}
	
	// Prepare help buttons
	HelpGenerator.avatar_url = client.user.avatarURL(); // Populate avatar URL
	HelpGenerator.loadDocs();
	HelpGenerator.generate();

	// Inject help buttons
	HelpGenerator.buttons.map( button => {
		reloadedButtons.set(button.button.customId, button);
	})

	client.buttons = reloadedButtons;
	console.log('[LiveReload] Loaded all buttons.');
}

console.log(`[LiveReload] Use "kill -SIGUSR2 ${process.pid}" to reload commands.`);

process.on('SIGUSR2', () => {
	console.log("[LiveReload] Received SIGUSR2, reloading commands...")
	loadHandlers();
})