const linebot = require('linebot');
const express = require('express');

const bot = linebot({
    channelId: '1620292817',
    channelSecret: 'c072b15b20bc268f41cd7de60666520d',
    channelAccessToken: 'ZJLsozpj0xjgmC7IjZsqm3pcrKR8YjeC2Qqjjm8ZZLOHqddqhIb8IGj/7en++Sys8V3oagnus+2DUKeKf087X7Kbc/ky4c46dyaxNu31A9Mos41kLzzaa3DztxjTWUFSd1bxeI6XRIntn/YWr7hM6wdB04t89/1O/w1cDnyilFU='
});


bot.on('message', function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
        event.reply(msg).then(function(data) {
            console.log(msg);
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