const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, client_id, dev_guild_id } = require('./config.json');
const fs = require('fs');

/**
 * Script to register commands to development guild at Discord API.
 */

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing guild (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(client_id, dev_guild_id),
			{ body: commands },
		);

		console.log('Successfully reloaded guild (/) commands.');
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();