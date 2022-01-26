require('dotenv').config()

// Get bot version dynamically
const fs = require('fs');
const version = JSON.parse(require('fs').readFileSync('package.json')).version;

// Require necessary Discord.js classes
const { Client, Intents } = require('discord.js');

// Create discord.js objects
const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] });

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag} running v${version}`);
});

client.on('messageCreate', (msg) => {
	if (msg.author.bot) return;

	console.log('hey');
	if (msg.content.toLowerCase().substring(0, 2) == '!ks') {
		console.log(msg.content);
		msg.channel.send('shut up');
	}
})

// Starts the bot
client.login(process.env.TOKEN);