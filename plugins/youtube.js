/* Copyright (C) 2022 Sourav KL11.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Raganork MD - Sourav KL11
*/
const {
  Module
} = require('../main');
const fs = require("fs");
const {
  MODE,
  HANDLERS,
  AUDIO_DATA,
  BOT_INFO
} = require('../config');
const ffmpeg = require('fluent-ffmpeg');
const {
  getString
} = require('./misc/lang');
const {
  getJson,
  searchYT,
  searchSong
} = require('./misc/misc');
const {
    ytTitle,downloadYT, dlSong, ytv, getResolutions
  } = require('./misc/yt');
const Lang = getString('scrapers');
const {
  skbuffer,
  ytdlServer,
  getVideo,
  addInfo
} = require('raganork-bot');
var handler = HANDLERS !== 'false'?HANDLERS.split("")[0]:""
let fm = MODE == 'public' ? false : true
const getID = /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:watch\?.*(?:|\&)v=|embed|shorts\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/;
Module({
  pattern: 'play ?(.*)',
  fromMe: fm,
  desc: "Play audios from YouTube",
  usage:'.play starboy',
  use: 'download'
}, (async (message, match) => {
if (!match[1]) return message.sendReply("_Need song name, eg: .play starboy_")
let sr = (await searchYT(match[1])).videos[0];
  const title = await ytTitle(sr.id)
  await message.sendReply(`*Downloading:* _${title}_`)
  let sdl = await dlSong(sr.id);
  ffmpeg(sdl)
  .save('./temp/song.mp3')
  .on('end', async () => { 
  var song = await addInfo('./temp/song.mp3',title,BOT_INFO.split(";")[0],"audio downloader",await skbuffer(`https://i3.ytimg.com/vi/${sr.id}/maxresdefault.jpg`))
  return await message.client.sendMessage(message.jid, {
      audio:song,
      mimetype: 'audio/mp4'
  }, {
      quoted: message.data
  });
});
}));
Module({
  pattern: 'ytv ?(.*)',
  fromMe: fm,
  desc: Lang.YTV_DESC,
  use: 'download'
}, (async (message, match) => {
  if (!match[1]) return message.sendReply("_Need YouTube video link!_")
  if (match[1].startsWith('dl;')){
    const link = match[1].split(';')[2]
    const res_ = match[1].split(';')[1]
    const result__ = await ytv(link,res_)
    const title = await ytTitle(link)
    return await message.client.sendMessage(message.jid,{video:result__,caption:`_${title} *[${res_}]*_`},{quoted:message.data}) 
  }
  var link = match[1].match(/\bhttps?:\/\/\S+/gi)
  if (link !== null && getID.test(link[0])) {
  link = link[0].match(getID)[1]
  var rows = []
  const result_ = await getResolutions(link)
  for (var i of result_){
    rows.push({
      title:i.fps60?i.quality+' 60fps':i.quality,
      description:i.size,
      rowId: handler+"ytv dl;"+(i.fps60?i.quality+'60':i.quality)+';'+link
  })
  }
  const sections = [{
      title:'Select a resolution',
      rows:rows
  }];
  const listMessage = {
      text: " ",
      title: "Select a quality",
      buttonText: "View all",
      sections
  }
 return await message.client.sendMessage(message.jid, listMessage,{quoted: message.data})
}
}));
Module({
  pattern: 'song ?(.*)',
  fromMe: fm,
  desc: Lang.SONG_DESC,
  use: 'download'
}, (async (message, match) => {
  if (!match[1]) return message.sendReply(Lang.NEED_TEXT_SONG)
  var link = match[1].match(/\bhttps?:\/\/\S+/gi)
  if (link !== null && getID.test(link[0])) {
  let v_id = link[0].match(getID)[1]
  const title = await ytTitle(v_id);
  await message.sendReply(`*Downloading:* _${title}_`)
  let sdl = await dlSong(v_id);
  ffmpeg(sdl)
  .save('./temp/song.mp3')
  .on('end', async () => { 
  var song = await addInfo('./temp/song.mp3',title,BOT_INFO.split(";")[0],"audio downloader",await skbuffer(`https://i3.ytimg.com/vi/${link[0].match(getID)[1]}/maxresdefault.jpg`))
  return await message.client.sendMessage(message.jid, {
      audio:song,
      mimetype: 'audio/mp4'
  }, {
      quoted: message.data
  });
 }); 
} else {
  var myid = message.client.user.id.split("@")[0].split(":")[0]
  var sr = await searchYT(match[1]);
  sr = sr.videos.splice(0,21);
  if (sr.length < 1) return await message.sendReply(Lang.NO_RESULT);
  var SongData = []
  for (var i in sr){
    const title = sr[i].title?.text
    if (title){
    SongData.push({
      title,
      description: sr[i].artist,
      rowId: handler+"song https://youtu.be/" + sr[i].id
  })
  }
  }
  const sections = [{
      title: Lang.MATCHING_SONGS,
      rows: SongData
  }];
  const listMessage = {
      text: "and "+(sr.length-1)+" more results..",
      title: sr[0].title.text,
      buttonText: "Select song",
      sections
  }
 return await message.client.sendMessage(message.jid, listMessage,{quoted: message.data})
}
}));

Module({
  pattern: 'yts ?(.*)',
  fromMe: fm,
  desc: "Select and download songs from yt (list)",
  use: 'search'
}, (async (message, match) => {
  if (!match[1]) return message.sendReply("*Need words*")
  var link = match[1].match(/\bhttps?:\/\/\S+/gi)
  if (link !== null && getID.test(link[0])) {
    var {
  info,
  thumbnail
} = await getJson("https://raganork-network.vercel.app/api/youtube/details?video_id=" +link[0].split("/")[3]);
const buttons = [
  {buttonId: handler+'video '+link[0], buttonText: {displayText: '𝗩𝗜𝗗𝗘𝗢'}, type: 1},
  {buttonId: handler+'song '+link[0], buttonText: {displayText: '𝗔𝗨𝗗𝗜𝗢'}, type: 1}
]
const buttonMessage = {
    image: {url: thumbnail},
    caption: info,
    footer: '',
    buttons: buttons,
    headerType: 4
}
return await message.client.sendMessage(message.jid, buttonMessage)
  }
  let sr = await searchYT(match[1]);
  sr = sr.videos;
  if (sr.length < 1) return await message.sendReply("*No results found!*");
  var videos = [];
  for (var index in sr) {
    const title = sr[index].title?.text  
    if (title){
    videos.push({
          title,
          description: sr[index].duration?.text,
          rowId: handler+"yts https://youtu.be/" + sr[index].id
      });
      }  }
  const sections = [{
      title: "YouTube search resulrs",
      rows: videos
  }]
  const listMessage = {
      text: "and " + (sr.length - 1) + " more results...",
      title: sr[0].title.text,
      buttonText: "Select a video",
      sections
  }
  await message.client.sendMessage(message.jid, listMessage,{quoted: message.data})
}));
