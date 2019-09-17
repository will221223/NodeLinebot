const linebot = require('linebot');
const express = require('express');
const firebaseDB = require('./firebase_admin');
const lineMsgDB = firebaseDB.ref('lineMsg')
//設定linebot
const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});
//因firebase.once('value')是非同步事件，需要使用Promise來接
//判斷DB是否已有關鍵字
function checkDB(msg){
    var DBmsg
    return new Promise((resolve, reject) => {
      lineMsgDB.once('value').then(function(data){
              data.forEach(function(datalist){
                if(datalist.val().keyword == msg){
                    DBmsg = datalist.val().message
                    resolve(DBmsg)
                    return DBmsg
                }
            })
                reject(msg)
        })
    })
}
//判斷DB是否已有重複學過這句話
function checkDouble(msg,keyword){
    var haslearned = false
    return new Promise((resolve, reject) => {
      lineMsgDB.once('value').then(function(data){
              data.forEach(function(datalist){
                if(datalist.val().keyword == keyword){
                    haslearned = true
                    reject(haslearned)
                    return haslearned
                }
            })
                resolve(haslearned)
        })
    })
}

async function judgement(msg){

    switch (msg.substr(0,4)){
        case ('學說話;'):{
            let received_text  = msg.slice(4)
            let semicolon_index = received_text.indexOf(';')
                if(semicolon_index == -1){
                    return '是不是沒有加分號;咧？汪！'
                }
            let keyword = received_text.substr(0,semicolon_index)
            let message = received_text.slice(semicolon_index+1)
            
            msg= 'keyword=' + keyword + ', message='+message
            // 判斷有沒有學過
            try{
                await checkDouble(msg,keyword)
                lineMsgDB.push({keyword:keyword,message:message})
                return '我學會啦～' 
            }catch(reject){
                    return '這句我學過了啦！'
                }
        }
        break;

        
        // else {
        default:{
            // 判斷有沒有學過關鍵字
            try{
            return await checkDB(msg)
            }catch(reject){
                return ''
            }
        }
        break;
    }
}

bot.on('message',async function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
        console.log('profile==',event.source.profile)
        console.log('member==',event.source.member)
        console.log('userId==',event.source.userId)
        event.reply(await judgement(msg)).then(function(data) {
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