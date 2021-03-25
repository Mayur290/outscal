require("dotenv").config(); // load bot key
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./credentials.json");

const doc = new GoogleSpreadsheet(
  "1k3xbPL3EeTZI8IhRcUOxbBZp4r2_lEYrdvUlTbptvNA"
);

const client = new Discord.Client({
  partials: ["MESSAGE"],
});

client.login(process.env.BOT_TOKEN);

// main function to be execute
const PREFIX = "!join-";
client.on("message", (msg) => {
  if (msg.author.bot) return;
  if (msg.content.startsWith(PREFIX) && msg.channel.type == "text") {
    const [content, ...args] = msg.content
      .trim()
      .substring(PREFIX.length)
      .split("join-");

    // calling function to connect with google sheet and perform actions
    accessSpreadsheet(msg, content);
  }
});

// this function is to check clan is enabled or not
// if enabled then call function 'accessSpreadsheet2'
async function accessSpreadsheet(msg, clan_name) {
  await doc.useServiceAccountAuth({
    client_email: creds.client_email,
    private_key: creds.private_key,
  });

  await doc.loadInfo();
  console.log(doc.title);

  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows({});

  var sheetarr = [];
  var clanName;
  var str;

  for (let i = 0; i < rows.length; i++) {
    if (clan_name == rows[i].clan) {
      clanName = rows[i].clan;
      sheetarr[0] = rows[i].roleId;
      sheetarr[1] = rows[i].enabled;

      str = sheetarr[1];
      str = str.trim();
      str = str.toUpperCase();
      break;
    }
  }

  // checking clan is enabled or not from google sheet
  if (str === "NO") {
    msg.reply(
      "Sorry the admission in this batch has closed! If you wish to apply for admission in next batch Please contact Outscal team"
    );
  } else if (str == "YES") {
    msg.reply("Please check your DM to verify your email id");

    let filter = (m) => m.author.id === msg.author.id;
    msg.author.send("Enter your registered `email Id` please.").then(() => {
      msg.author.dmChannel
        .awaitMessages(filter, {
          max: 1,
          time: 80000,
          errors: ["time"],
        })
        .then((m) => {
          m = m.first();
          msg.author.send(
            "Give me a minute to verify if the email address exist in our Database"
          );

          var email = m.content;
          console.log(email);
          email = email.trim(email);
          email = email.toLowerCase();

          accessSpreadsheet2(msg, email, clan_name);

          return;
        })
        .catch((collected) => {
          msg.author.send("Time out");
          msg.author.send(
            "Request denied because you did not responded in time"
          );
        });
    });
  }
}

client.on("ready", () => {
  console.log("Our bot is ready to go!!!!!!!!!");
});

// this function is do query related to email and candidate_id
async function accessSpreadsheet2(msg, email, clan_name) {
  const sheet2 = doc.sheetsByIndex[1];
  const rows = await sheet2.getRows({});

  var index = -1; // to check mail id exist in database
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].email == email) {
      index = i;
      break;
    }
  }

  if (index == -1) {
    // mail id not exist in  database
    msg.author.send("This `email Id` is not registered with us ");
  } else {
    //mail id exists in database

    // checking candidate_id for particular mail id exist or not
    if (rows[index].candidate_id !== undefined) {
      msg.author.send(
        `This email is already authorized to access the \`${clan_name}\`. You can try with another emailID registered with us or Contact Outscal team for support`
      );
    } else {
      // As candidate_id not exists in database, update databse

      msg.author.send(
        `Welcome to batch! Looking forward to you building something cool!`
      );

      rows[index].candidate_id = msg.author.id;
      rows[index].email = email;
      rows[index].command = "!join-" + clan_name;
      await rows[index].save();

      // send  details of new registration to channel "system-updates"
      const channel = client.channels.cache.find(
        (channel) => channel.name === "system-updates"
      );
      channel.send(
        "User has joined a clan! Here are the details\n" +
          `User Email:  ${email}\n` +
          `User Id: ${msg.author.id}\n` +
          `User Clan:  ${clan_name}`
      );
    }
  }
  return;
}
