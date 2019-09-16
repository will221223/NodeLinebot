const linebot = require('linebot');
const express = require('express');

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

function learn(msg){
    if(msg.substr(0,4)=='學說話;'){
        let received_text  = msg.slice(4)
        console.log('received_text=',received_text)
        let semicolon_index = received_text.indexOf(';')
            if(semicolon_index == -1){
                return msg
            }
        let keyword = received_text.substr(0,semicolon_index)
        let message = received_text.slice(semicolon_index+1)
        console.log('keyword=' + keyword , 'message='+message)
        msg= 'keyword=' + keyword + 'message='+message
    }else{
    console.log('有進來～')
        return msg
    }
}

bot.on('message', function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
        event.reply(msg).then(function(data) {
            learn(msg)
        }).catch(function(error) {
            console.log('錯誤產生，錯誤碼：'+error);
        });
    }
    
    // switch (event.message.type) {
	
	// 	case 'text':
	// 		switch (msg) {				
	// 			case '二哈':
	// 				return event.reply('愛吃屎')
	// 				break;
	// 			case '安安':
	// 			return event.reply('安')
	// 			break;
	// 			case '吃什麼':
	// 			return event.reply('屎')
	// 			break;	
    //     }
    // }
});

const app = express();

const linebotParser = bot.parser();
app.get("/", function (req, res) { 
    console.log(bot)
    res.send("Hello LineBot");
});
app.post('/', linebotParser);

const server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log('App now running on port', port);
});