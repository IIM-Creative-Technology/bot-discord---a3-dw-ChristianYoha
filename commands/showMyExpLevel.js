const Discord = require('discord.js');
const embed = new Discord.MessageEmbed();
const connection = require('../database'); 


// Afficher le niveau d'expérience
module.exports.run = async (client, message, arguments) => {
    const embed = new Discord.MessageEmbed();
    let text = "";
    connection.query("SELECT * FROM xp WHERE user_id ="+message.author.id, function (error, results, fields) {
        if (error) throw error;
        if(results.length){
            console.log(results[0].xp_level);
            text = "Vous êtes au niveau "+results[0].xp_level;
        }else{
            text = "Vous n'êtes enregistré dans la base de données ";
        }

        embed.setTitle('Niveau d\'expérience').setDescription(text.toString());
        message.channel.send({
            embeds: [embed]
        })
    })
};

module.exports.name = 'ShowMyExpLevel';