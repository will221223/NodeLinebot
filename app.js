const linebot = require('linebot');
const express = require('express');
const firebaseDB = require('./firebase_admin');

const lineMsgDB = firebaseDB.ref('lineMsg')


const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

function learn(msg){
    if(msg.substr(0,4)=='學說話;'){
        let received_text  = msg.slice(4)
        // console.log('received_text=',received_text)
        let semicolon_index = received_text.indexOf(';')
            if(semicolon_index == -1){
                return msg
            }
        let keyword = received_text.substr(0,semicolon_index)
        let message = received_text.slice(semicolon_index+1)
        
        msg= 'keyword=' + keyword + ', message='+message
        lineMsgDB.push({keyword:keyword,message:message})
        return '我學會啦～'
    }else{
        lineMsgDB.once('value',function(data){
            let msglist = []
            data.forEach(function(datalist){
                console.log('datalist.val().keyword=',datalist.val().keyword)
                console.log('msg=',msg)
                if(datalist.val().keyword == msg){
                    msg = datalist.val().message
                    console.log('msg inside=',msg)
                    return msg
                }
            })
        })
    console.log('有進來～')
    }
}

bot.on('message', function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
        // learn(msg)
        event.reply(learn(msg)).then(function(data) {
            console.log('reply success')
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