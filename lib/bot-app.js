require('dotenv').config()

// Get bot version dynamically
const fs = require('fs');
const version = JSON.parse(require('fs').readFileSync('package.json')).version;

// Require necessary Discord.js classes
const { Client, Intents, Collection } = require('discord.js');

// Create discord.js objects
const client = new Client({ intents: [] });
client.commands = new Collection(); // store commands instead of writing if statement for each command

// Load in commands dynamically
const commandFiles = fs.readdirSync('./commands');

// Adds each command in the `./commands` folder to the bot
for (const file of commandFiles) {
	if (file.toLowerCase().endsWith('.js')) {
		const cmd = require(`../commands/${file}`);
		client.commands.set(cmd.name, cmd);
	}
}

// Basically the 'onStart' method - this runs when it successfully connects to discord and initiates itself
client.on('ready', () => {
	// client.user.setPresence({ activity: { name: 'you be horny in main', type: 'WATCHING' }, status: 'idle' })
	// 	.catch(console.error);
	console.log(`Logged in as ${client.user.tag} running v${version}`);
});

client.on('interactionCreate', async interaction => {
    console.log(interaction);
    if (!interaction.isCommand()) return;
});

// Starts the bot
client.login(process.env.TOKEN);