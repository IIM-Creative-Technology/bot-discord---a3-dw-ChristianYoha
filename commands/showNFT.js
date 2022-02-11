const Discord = require('discord.js');
const {default:axios} =  require('axios');
/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @param {Array<String>} arguments
 */


// Affichage d'une collection NFT
module.exports.run = async (client, message, arguments) => {
  const embed = new Discord.MessageEmbed();
  axios.get('https://api.x.immutable.com/v1/collections/0x6a48058d26244b4f52ae22fad059e20606909e82').then((res)=>{
    embed.setTitle(res.data.name).setDescription(res.data.name).setImage(res.data.collection_image_url);
    message.channel.send({
      embeds: [embed]
    })
  })
};

module.exports.name = 'ShowNFT';
