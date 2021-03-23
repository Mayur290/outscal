require("dotenv").config();
// load into process.env

const Discord = require("discord.js");
const client = new Discord.Client({
  partials: ["MESSAGE"],
});

const BOT_PREFIX = "!";
const MOD_ME_COMMAND = "mod-me";

client.on("messageDelete", (msg) => {
  msg.channel.send("stop deleting messages");
});

client.on("ready", () => {
  console.log("Our bot is ready to go!!!!!!!!!");
});

client.on("message", (msg) => {
  if (msg.content == "I love Apurva") {
    msg.react("🌈");
  }

  if (msg.content === `${BOT_PREFIX}${MOD_ME_COMMAND}`) {
    modUser(msg.member);
  }
});

function modUser(member) {
  member.roles.add("823856338127028254");
}
client.login(process.env.BOT_TOKEN);
