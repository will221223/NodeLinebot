const linebot = require('linebot');
const express = require('express');
const firebaseDB = require('./firebase_admin');
const lineMsgDB = firebaseDB.ref('lineMsg')
const lineMsgReplyDB = firebaseDB.ref('ineMsgReply')
const lineMsgReceivedDB = firebaseDB.ref('lineMsgReceived')

//設定linebot
const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});
//因firebase.once('value')是非同步事件，需要使用Promise來接
//判斷DB是否已有關鍵字
function checkDB(msg,userId){
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
function checkDouble(userId,keyword){
    return new Promise((resolve, reject) => {
        lineMsgReceivedDB.once('value').then(function(data){
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
//推齊
async function echo(keyword){
    try{
        await checkReceived(keyword)
        await checkReply(keyword)
        if(await checkReceived(keyword) && await checkReply(keyword)){
            return keyword
        }else{
            console.log('不說話～')
        }
        
    }catch(reject){
            console.log('echo reject===',reject)
        }
}

function checkReceived(keyword){
    var countReceived = 0
    var hadRecieved = false
    return new Promise((resolve, reject) => {
        lineMsgReceivedDB.once('value').then(function(data){
              data.forEach(function(datalist){
                if(datalist.val().received == keyword){
                    countReceived ++
                }
            })
            console.log('countReceived==',countReceived)
            if(countReceived >= 2){
                hadRecieved = true
                console.log('有收過 true?',hadRecieved)
                resolve(hadRecieved)
                return
            }
            console.log('有收過 false?',hadRecieved)
            reject(hadRecieved)
        })
    })
}

function checkReply(keyword){
    var countReply = 0
    var hadReply = false
    return new Promise((resolve, reject) => {
        lineMsgReplyDB.orderByChild('reply').once('value').then(function(data){
                data.forEach(function(datalist){
                if(datalist.val().reply == keyword){
                    countReply ++
                }
            })
            console.log('countReply==',countReply)
            if(countReply >= 1){
                console.log('有打過 true?',hadReply)
                reject(hadReply)
                return
            }
            hadReply = true
            console.log('有打過 false?',hadReply)
            resolve(hadReply)
        })
    })
}

async function judgement(msg,userId){
    lineMsgReceivedDB.push({userId:userId,received:msg})
    switch (msg.substr(0,4)){
        case ('學說話;'):{
            let received_text  = msg.slice(4)
            let semicolon_index = received_text.indexOf(';')
                if(semicolon_index == -1){
                    lineMsgReplyDB.push({userId:userId,reply:'是不是沒有加分號;咧？汪！'})
                    return '是不是沒有加分號;咧？汪！'
                }
            let keyword = received_text.substr(0,semicolon_index)
            let message = received_text.slice(semicolon_index+1)
            
            msg= 'keyword=' + keyword + ', message='+message
            // 判斷有沒有學過
            try{
                await checkDouble(msg,keyword)
                lineMsgDB.push({keyword:keyword,message:message})
                lineMsgReplyDB.push({userId:userId,reply:'我學會啦～'})
                return '我學會啦～' 
            }catch(reject){
                lineMsgReplyDB.push({userId:userId,reply:'這句我學過了啦！'})
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
                // lineMsgReceivedDB.push({userId:userId,received:reject})
                // return ''
                try{
                    return await echo(msg)
                    }catch(reject){
                        lineMsgReceivedDB.push({userId:userId,received:reject})
                        return ''
                    }
            }
        }
        break;
    }
}

bot.on('message',async function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text
        let userId = event.source.userId
        event.reply(await judgement(msg,userId)).then(function(data) {
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