const clientLoader = require('./src/clientLoader');
const commandLoader = require('./src/commandLoader');
require('colors');

const connection = require('./database'); 
const COMMAND_PREFIX = '!';
const Discord = require('discord.js');
const embed = new Discord.MessageEmbed();
const embed2 = new Discord.MessageEmbed();


// Fonction d'assignation et retrait de role
function addRoleByLevel(message,embed,level){
  const roles = [
                  "941251946608754751", // "Role de base - EXP" pour le niveau 1
                  "941252133687271424", // "Role medium - EXP" pour le niveau 2
                  "941252246673428510" // "Role senior - EXP" pour le niveau 3
                ];

  let assignedRole = level <= 1 ? message.guild.roles.cache.find(r => r.id === roles[0]) : 
                (level == 2 ? message.guild.roles.cache.find(r => r.id === roles[1]) :
                message.guild.roles.cache.find(r => r.id === roles[2]));

  // Assigner nouveau role
  message.member._roles.forEach(role =>{
    if(role !== assignedRole.id){
      message.member.roles.add(assignedRole);
    }
  });

  // Retirer l'ancien role
  roles.forEach(x => {
    if(x != assignedRole.id)
      message.member.roles.remove(x);
  })

  // Affichage message
  embed.setTitle("Super!!!!! Nouveau role pour vous!")
        .setDescription("Etant au niveau "+level+", vous recevez: "+assignedRole.name)
        .setColor(assignedRole.color);

  message.channel.send({
      embeds: [embed]
  })
}

clientLoader.createClient(['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS'])
  .then(async (client) => {
    await commandLoader.load(client);

    // Ajouter le role de bienvenu à un nouveau membre.
    client.on('guildMemberAdd', async (member)=>{
      const guild = member.guild;
      const welcomeRoleId = "940648081278525461";
      await member.roles.add(welcomeRole); 
    })

    // Manipulation de la base de donnée.
    client.on('messageCreate', async (message) => {
      if (!message.author.bot && !message.content.startsWith(COMMAND_PREFIX) ){
        connection.query("SELECT * FROM xp", function (error, results, fields) {
          if (error) throw error;
          // Ajout de l'XP en base de données.
          if(results.length === 0 || !results.some((el)=>{return el.user_id === message.author.id})) {
            connection.query("INSERT INTO xp (user_id, xp_count) VALUES ('"+message.author.id+"', 1)", (err, results, fields) => {
              console.log('Insert new:', results);
              // 
              if(message.channel.name != "général") {
                client.channels.cache.forEach(channel => {
                  if (channel.name === "shared") {
                   embed2.setTitle(message.author.username+" a envoyé un message.").setDescription('Depuis le serveur: '+message.guild.name+' \n Son nivau d\'XP est: 1');
                   channel.send({embeds: [embed2]})
                  }
                })
              }
            });
          } else {
            results.forEach(user => {
              if(message.author.id === user.user_id) {
                user.xp_count = user.xp_count + 1;
                // Mise à jour de l'expérience
                connection.query("UPDATE xp SET xp_count = "+ user.xp_count+" WHERE id = "+user.id+"", (error, results, fields) => {
                  if (error) throw error;
                  console.log("Update count successfully: ");
                  embed.setTitle(message.author.username).setDescription('Votre xp est: '+user.xp_count);
                  message.channel.send({embeds: [embed]})
                  // 
                  if(message.channel.name != "général") {
                    client.channels.cache.forEach(channel => {
                      if (channel.name === "shared") {
                        embed2.setTitle(message.author.username+" a envoyé un message.").setDescription('Depuis le serveur: '+message.guild.name+' \n Son nivau d\'XP est: '+user.xp_count);
                        channel.send({embeds: [embed2]})
                      }
                    })
                  }
                })
                // Mise à jour du niveau d'expérience
                if((user.xp_count % 4) === 0) {
                  user.xp_level = user.xp_level + 1;
                  connection.query("UPDATE xp SET xp_level = "+ user.xp_level+" WHERE id = "+user.id+"", (error, results, fields) => {
                    if (error) throw error;
                    embed.setTitle(message.author.username).setDescription('Votre level vient d\'augmenter : '+user.xp_level);
                    message.channel.send({embeds: [embed]});
                    // Assignation du role selon le niveau d'expérience
                    addRoleByLevel(message, embed, user.xp_level);
                  })
                }
              }
            });
          }
        });
      }

      // Ne pas tenir compte des messages envoyés par les bots, ou qui ne commencent pas par le préfix
      if (message.author.bot || !message.content.startsWith(COMMAND_PREFIX)) return;
      // On découpe le message pour récupérer tous les mots
      const words = message.content.split(' ');

      const commandName = words[0].slice(1); // Le premier mot du message, auquel on retire le préfix
      const arguments = words.slice(1); // Tous les mots suivants sauf le premier

      if (client.commands.has(commandName)) {
        // La commande existe, on la lance
        client.commands.get(commandName).run(client, message, arguments);
      } else {
        // La commande n'existe pas, on prévient l'utilisateur
        await message.delete();
        await message.channel.send(`The ${commandName} does not exist.`);
      }
    })
});

