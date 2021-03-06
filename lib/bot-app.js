require('dotenv').config()

// Get bot version dynamically
const fs = require('fs');
const version = JSON.parse(require('fs').readFileSync('package.json')).version;

// Require necessary Discord.js classes
const { Client, Intents } = require('discord.js');

const ADMIN_ROLES = ['547573516086673428', '580118807398580235'];
const ROLE_ID = '936845927044485211';

// Create discord.js objects
const client = new Client({
	// This tells discord to only subscribe my bot to events related to intents I specify in this array.
	// Almost every bot needs Guild (discord servers) intents, and I'll need messages and member stuff.
	intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS ]
});

/**
 * Processes a list of Discord usernames (in the format of `Username#1234`) and returns an array of Discord users
 * from the specified guild.
 * 
 * @param {String} message An unprocessed list of Discord usernames with their tag in the format of `Name#1234`
 */
function processNames(message, guild, channel, callback) {
	// Replace all spaces, new lines, and semi-colons with a comma
	let list = message.substring(4).replace(/[\n;]/gm, ',');

	// Split into array using a comma as the separator
	let names = list.split(',');
	const discordUsers = [];

	names.forEach((tag) => {
		guild.members.fetch({ cache: false })
			.then((members) => {
				const member = members.find(m => m.user.tag.toLowerCase() == tag.toLowerCase());
				discordUsers.push(member != null ? member : {
					err: `Unable to find user in server`,
					tag
				});
			})
			.catch((err) => {
				discordUsers.push({
					err, tag
				});
			})
			.finally(() => {
				if (discordUsers.length == names.length)
					callback(discordUsers, guild, channel);
			});
	});
}

function callback(members, guild, channel) {
	let errMsg = "";
	let role = guild.roles.cache.find(r => r.id == ROLE_ID);
	let successCount = 0, totalCount = 0;

	function assignRoles() {
		members.forEach((member) => {
			if (member.err) {
				errMsg += `[${member.tag}] ${member.err}\n`;
				processedUser();
			} else {
				member.roles.add(role)
					.then(() => {
						successCount++;
					})
					.catch((err) => {
						console.log(err);
						errMsg += `[${member.user.tag}] Unable to assign role due to permission-related error (are you assigning the correct role?)\n`;
					})
					.finally(processedUser);
			}
		});
	}

	function processedUser() {
		if (++totalCount == members.length) {
			if (errMsg.length == 0) {
				channel.send(`Successfully processed ${members.length} user(s)`);
			} else {
				if (successCount > 0)
					channel.send(`Successfully processed ${successCount} of ${members.length} user(s).\n\`\`\`${errMsg}\`\`\``);
				else
					channel.send(`Unable to process users.\n\`\`\`${errMsg}\`\`\``)
			}
		}
	}

	if (!role) {
		guild.roles.fetch(ROLE_ID)
			.then((r) => {
				role = r;
				assignRoles();
			})
			.catch((err) => {
				errMsg = err;
			});
	} else
		assignRoles();
}

function checkPermission(roles) {
	for (let i = 0; i < ADMIN_ROLES.length; i++) {
		if (roles.cache.find(r => r.id == ADMIN_ROLES[i]))
			return true;
	}
	return false;
}

const users = fs.readFileSync('users.txt', { flag: 'r' }).toString();
const kickstarterUsers = users.split('\r\n');

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag} running v${version}`);
});

client.on('messageCreate', (msg) => {
	if (msg.author.bot) return;

	if (msg.content.toLowerCase().substring(0, 3) == '!ks') {
		if (checkPermission(msg.member.roles)) {
			processNames(msg.content, msg.guild, msg.channel, callback);
		} else {
			msg.channel.send('You do not have permission to run this command.');
		}
	}
});

client.on('guildMemberAdd', (member) => {
	if (kickstarterUsers.includes(member.user.tag)) {
		let role = member.guild.roles.cache.find(r => r.id == ROLE_ID);

		function assignRole() {
			member.roles.add(role)
				.then(() => {
					member.user.send(
`???? **Welcome to the Temple Door Games Discord server for Swordcery!** ?????? 

If you've received this message then you've been knighted! AKA you backed us at the Deluxe Edition+ on Kickstarter and you're now part of the Vanguard Knights!

As part of the Vanguard Knights you have access to the **#the-gilded-court** channel where we'll be occasionally getting feedback on ideas, polling to see what you're most excited about, and posting stuff other members may not have access to! 

Please enjoy your time in the server and thank you again for supporting us! ????`)
					.catch((err) => {
						member.guild.channels.cache.find(c => c.name == "mod-disussion").send(`Unable to assign role to ${member.user.tag}. Please do so manually.`)
							.catch(err => console.log(`Unable to message in mod channel and also assign role to ${member.user.tag}.\n\n${err}`));
						console.error(err);
					});
				})
				.catch((err) => {
					member.guild.channels.cache.find(c => c.name == "mod-disussion").send(`Unable to assign role to ${member.user.tag}. Please do so manually.`)
						.catch(err => console.log(`Unable to message in mod channel and also assign role to ${member.user.tag}.\n\n${err}`));
					console.error(err);
				});
		}

		if (!role) {
			guild.roles.fetch(ROLE_ID)
				.then((r) => {
					role = r;
					assignRole();
				})
				.catch((err) => {
					errMsg = err;
				});
		} else
			assignRole();
	}
});

// Starts the bot
client.login(process.env.TOKEN);

/**
 * TODO:
 * 	1. When user joins server, check if they're in data.json list. If so, give them role
 * 	2. Update command to send a message when you run command. Something like:
 * 
 * 		User#1234 - Pending...
 * 		User#1235 - Pending...
 * 		User#1233 - Pending...
 * 
 *     Update message periodically (every 1 second). Bold users that failed & reaplce pending text with reason for failure
 * 	3. Put bot on AWS
 */