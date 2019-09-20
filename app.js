const linebot = require('linebot');
const express = require('express');
const cheerio = require('cheerio')
const firebaseDB = require('./firebase_admin');
const lineMsgDB = firebaseDB.ref('lineMsg')
const lineMsgReplyDB = firebaseDB.ref('ineMsgReply')
const lineMsgReceivedDB = firebaseDB.ref('lineMsgReceived')
const rp = require('request-promise');
const request = require('request');

const app = express();
app.set('view engine', 'ejs');

const opts = {
    uri: "http://opendata2.epa.gov.tw/AQI.json",
    json: true
};
 
//設定linebot
const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

//查空氣
function getWeather(SiteName){
    return new Promise((resolve, reject) => {
    rp(opts).then(function (repos) {
    let data;
    let send;
    let err = '無法取得該地區空氣品質資料～請確認地區名稱是否正確～'
    for (i in repos) {
        if (repos[i].SiteName  == SiteName) {
            data = repos[i];
            send = (data.County + data.SiteName +
						'\n\nPM2.5指數：'+ data["PM2.5_AVG"] + 
						'\n狀態：' + data.Status)
            break;
        }
    }
        if(send){
        console.log('send=',send);
        resolve(send)
        return send
        }else{
            resolve(err)
        return err
        }
    })
    .catch(function (err) {
        reject(err);
    })
  })
}

//因firebase.once('value')是非同步事件，需要使用Promise來接
//判斷DB是否已有關鍵字
function checkDB(msg,userId,groupId){
    var DBmsg
    if(!groupId){
        groupId='no group Id'
    }
    return new Promise((resolve, reject) => {
      lineMsgDB.once('value').then(function(data){
              data.forEach(function(datalist){
                  //如果說的話＆同群組符合>回傳關鍵字
                if(datalist.val().keyword == msg && datalist.val().groupId == groupId){
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
function checkDouble(groupId,keyword){
    var haslearned =false
    return new Promise((resolve, reject) => {
        lineMsgDB.once('value').then(function(data){
              data.forEach(function(datalist){
                if(datalist.val().keyword == keyword && datalist.val().groupId == groupId){
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
async function echo(keyword,userId,groupId){
    //判斷同群組內收到的訊息是否重複
    //不重複回上一句回覆的訊息
   //若兩者都是true就推齊
    try{
        await checkReceived(keyword,groupId)
        await checkReply(keyword,groupId)
        if(await checkReceived(keyword,groupId) && await checkReply(keyword,groupId)){
            lineMsgReplyDB.push({userId:userId,reply:keyword})
            lineMsgReceivedDB.set({})
            // lineMsgReplyDB.set({})
            return keyword
        }else{
            console.log('不說話～')
        }
    }catch(reject){
            console.log('echo reject===',reject)
        }
}

//確認最近5筆收到的訊息是否重複
function checkReceived(keyword,groupId){
    var countReceived = 0
    var hadRecieved = false
    return new Promise((resolve, reject) => {
        lineMsgReceivedDB.orderByKey().limitToLast(5).once('value').then(function(data){
            data.forEach(function(datalist){
                if(datalist.val().received == keyword && datalist.val().groupId == groupId){
                    countReceived ++
                }
            })
            if(countReceived >= 2){
                hadRecieved = true
                resolve(hadRecieved)
                return
            }
            reject(hadRecieved)
        })
    })
}

//確認機器人上一句回應是否重複
function checkReply(keyword,groupId){
    var hadNoReply = true
    return new Promise((resolve, reject) => {
        lineMsgReplyDB.orderByKey().limitToLast(1).once('value').then(function(data){
            data.forEach(function(datalist){
                if(datalist.val().reply == keyword && datalist.val().groupId == groupId){
                    hadNoReply = false
                }
            })
            if(!hadNoReply){
                reject(hadNoReply)
                return
            }
            resolve(hadNoReply)
        })
    })
}

//學關鍵字說話
async function leanKeywordSpeak(msg,userId,groupId){
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
        await checkDouble(groupId,keyword)
        lineMsgDB.push({groupId:groupId,keyword:keyword,message:message})
        lineMsgReplyDB.push({groupId:groupId,userId:userId,reply:'我學會啦～'})
        return '我學會啦～' 
    }catch(reject){
        lineMsgReplyDB.push({groupId:groupId,userId:userId,reply:'這句我學過了啦！'})
            return '這句我學過了啦！'
        }
}

//查空氣PM2.5
async function queryPM25(msg){
    let semicolon_index = msg.indexOf(';')
            let SiteName
                if(semicolon_index == -1){
                    return '是不是沒有加分號;咧？汪！'
                }else if(semicolon_index == 3){
                     SiteName  = msg.slice(4)
                }
            try{
                return getWeather(SiteName)
                }catch(reject){
                 return reject
                } 
}

// 判斷同群組內有無學過關鍵字，若無，則判斷訊息是否重複說，重複的話就推齊
//若沒學過也沒重複說過，則不說話
async function judgeLearnOrNot(msg,userId,groupId){
try{
    return await checkDB(msg,userId,groupId)
    }catch(reject){
        try{
            return await echo(msg,userId,groupId)
            }catch(reject){
                lineMsgReceivedDB.push({groupId:groupId,userId:userId,received:reject})
                return ''
            }
    }
}

async function judgement(msg,userId,groupId){
    lineMsgReceivedDB.push({groupId:groupId,userId:userId,received:msg})

    switch (msg.substr(0,4)){
        case ('學說話;'):{
            return leanKeywordSpeak(msg,userId,groupId)
        }
        break;
        case ('查空氣;'):{
            return queryPM25(msg)
        }
        break;

        case ('help'):{
            const txt="指令：\r\n輸入星座，獲取今日運勢，如「金牛」\r\n輸入「查空氣;所在縣市」，獲取今日PM2.5值，如「查空氣;大寮」\r\n輸入「學說話;關鍵字;機器人回覆」，如「學說話;test;test success」"
            return txt
        }
        break;
               
        default:
           return  judgeLearnOrNot(msg,userId,groupId)
           break;
    }
}

function lucky(event,msg){

    var Stype={"水瓶":10,"雙魚":11,"牡羊":0,"金牛":1,"雙子":2,"巨蟹":3,"獅子":4,"處女":5,"天秤":6,"天蠍":7,"射手":8,"魔羯":9}
		if(Stype.hasOwnProperty(msg))
		{
			var Today=new Date();
			var Y=Today.getFullYear()
				,M=(parseInt(Today.getMonth())<10) ? "0"+(Today.getMonth()+1) : (Today.getMonth()+1)
				,D=(parseInt(Today.getDate())<10) ? "0"+Today.getDate() : Today.getDate()
			let fullDate= Y+"-"+M+"-"+D
			var url=`http://astro.click108.com.tw/daily_${Stype[msg]}.php?iAcDay=${fullDate}&iAstro=${Stype[event.message.text]}`
			request(url, (err, res, body) => {
			// 把 body 放進 cheerio 準備分析
			const $ = cheerio.load(body)
			let weathers = []
			$('.TODAY_CONTENT').each(function(i, elem) {
				weathers.push($(this).text().split('\n'))
			})
			weathers = weathers.map(weather => ({
				intro:weather[1].trim(),
				all: weather[2].trim(),//.substring(2).split(' ')[0],
				love: weather[3].trim(),//.substring(2),
				work: weather[5].trim(),//.substring(2),
				money: weather[6].trim(),//.substring(2),
			  }))  
			  var AllString=weathers[0].intro+"\r\n"+weathers[0].all+"\r\n"+weathers[0].love+"\r\n"+weathers[0].work+"\r\n"+weathers[0].money;
			  return event.reply(AllString)
			})
		}
}

bot.on('message',async function(event) {
    if (event.message.text !== undefined) {
        let msg = event.message.text
        let userId = event.source.userId
        let groupId = event.source.groupId || 'no group Id'

        //查星座
        lucky(event,msg)

        //依照收到的訊息判斷回覆
        event.reply(await judgement(msg,userId,groupId)).then(function(data) {
            console.log('reply success')
        }).catch(function(error) {
            console.log('錯誤產生，錯誤碼：'+error);
        })
    }
});

    bot.on('join', function (event) {
        event.reply('輸入help獲得相關指令');
    });

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