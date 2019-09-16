const linebot = require('linebot');
const express = require('express');

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

bot.on('message', function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
        event.reply(msg).then(function(data) {
            console.log(event)
        }).catch(function(error) {
            console.log('錯誤產生，錯誤碼：'+error);
        });
    }
});

const app = express();

const linebotParser = bot.parser();
app.get("/", function (req, res) { 
    res.send("Hello LineBot");
});
app.post('/', linebotParser);

const server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log('App now running on port', port);
});