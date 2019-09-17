const linebot = require('linebot');
const express = require('express');
const firebaseDB = require('./firebase_admin');

const lineMsgDB = firebaseDB.ref('lineMsg')


const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

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

async function judgement(msg){
    // switch (msg){
    if (msg.substr(0,4)=='學說話;'){
        let received_text  = msg.slice(4)
        let semicolon_index = received_text.indexOf(';')
            if(semicolon_index == -1){
                return '是不是沒有加分號;咧？汪！'
            }
        let keyword = received_text.substr(0,semicolon_index)
        let message = received_text.slice(semicolon_index+1)
        
        msg= 'keyword=' + keyword + ', message='+message

        var haslearned = false
        lineMsgDB.once('value',function(data){
            data.forEach(function(datalist){
              if(datalist.val().keyword == keyword){
                  console.log('有進來')
                  haslearned = true
                  console.log('haslearned=',haslearned)
              }
          })
        })
        console.log('haslearned outside=',haslearned)
        if(haslearned){
            return '這句我學過了啦！嫩'
        }else{
        lineMsgDB.push({keyword:keyword,message:message})
        return '我學會啦～'
       }
    }else {
        try{
        return await checkDB(msg)
        }catch(reject){
            return reject
        }
    }
}

bot.on('message',async function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
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