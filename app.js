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

// const SiteName = '鳳山';
const opts = {
    uri: "http://opendata2.epa.gov.tw/AQI.json",
    json: true
};
 
//查天氣
function queryWeather(SiteName){
    return new Promise((resolve, reject) => {
    rp(opts).then(function (repos) {
    let data;
    let send;
    for (i in repos) {
        if (repos[i].SiteName  == SiteName) {
            data = repos[i];
            send = (data.County + data.SiteName +
						'\n\nPM2.5指數：'+ data["PM2.5_AVG"] + 
						'\n狀態：' + data.Status)
            break;
        }
    }
    console.log('send=',send);
    resolve(send)
    return send
    })
    .catch(function (err) {
        reject('無法取得該地區空氣品質資料～請確認地區名稱是否正確～');
    })
  })
}

//查星座
// function queryFortune(keyword){
    var AllString
    var Stype={"水瓶":10,"雙魚":11,"牡羊":0,"金牛":1,"雙子":2,"巨蟹":3,"獅子":4,"處女":5,"天秤":6,"天蠍":7,"射手":8,"魔羯":9}
    if(Stype.hasOwnProperty(keyword))
    {
        var Today=new Date();
        var Y=Today.getFullYear()
            ,M=(parseInt(Today.getMonth())<10) ? "0"+(Today.getMonth()+1) : (Today.getMonth()+1)
            ,D=(parseInt(Today.getDate())<10) ? "0"+Today.getDate() : Today.getDate()
        let fullDate= Y+"-"+M+"-"+D
        var url=`http://astro.click108.com.tw/daily_${Stype[keyword]}.php?iAcDay=${fullDate}&iAstro=${Stype[keyword]}`
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
          All=weathers[0].intro+"\r\n"+weathers[0].all+"\r\n"+weathers[0].love+"\r\n"+weathers[0].work+"\r\n"+weathers[0].money;
          AllString = All
            console.log('AllString inside==',AllString)
        })
     }
    console.log('AllString outside==',AllString)
    return AllString
// }

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
    var haslearned =false
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
//推齊
async function echo(keyword,userId){
    try{
        await checkReceived(keyword)
        await checkReply(keyword)
        if(await checkReceived(keyword) && await checkReply(keyword)){
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

function checkReceived(keyword){
    var countReceived = 0
    var hadRecieved = false
    return new Promise((resolve, reject) => {
        lineMsgReceivedDB.orderByKey().limitToLast(5).once('value').then(function(data){
            data.forEach(function(datalist){
                    // console.log('Received datalist==',datalist.val())
                if(datalist.val().received == keyword){
                    countReceived ++
                }
            })
            // console.log('countReceived==',countReceived)
            if(countReceived >= 2){
                hadRecieved = true
                // console.log('有收過 true?',hadRecieved)
                resolve(hadRecieved)
                return
            }
            // console.log('有收過 false?',hadRecieved)
            reject(hadRecieved)
        })
    })
}

function checkReply(keyword){
    // var countReply = 0
    var hadNoReply = true
    return new Promise((resolve, reject) => {
        lineMsgReplyDB.orderByKey().limitToLast(1).once('value').then(function(data){
            data.forEach(function(datalist){
                    // console.log('reply datalist==',datalist.val())
                if(datalist.val().reply == keyword){
                    // countReply ++
                    hadNoReply = false
                }
            })
            // console.log('countReply==',countReply)
            if(!hadNoReply){
                // console.log('有打過 true?',hadReply)
                reject(hadNoReply)
                return
            }
            // console.log('有打過 false?',hadReply)
            resolve(hadNoReply)
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
        case ('查空氣;'):{
            let semicolon_index = msg.indexOf(';')
            let SiteName
                if(semicolon_index == -1){
                    return '是不是沒有加分號;咧？汪！'
                }else if(semicolon_index == 3){
                     SiteName  = msg.slice(4)
                }
                return queryWeather(SiteName)
        }
        break;
               
        // else {
        default:{
            // 判斷有沒有學過關鍵字
            try{
            return await checkDB(msg)
            }catch(reject){
                try{
                    return await echo(msg,userId)
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
    if (event.message.text !== undefined) {
        let msg = event.message.text
        let userId = event.source.userId

        var Stype={"水瓶":10,"雙魚":11,"牡羊":0,"金牛":1,"雙子":2,"巨蟹":3,"獅子":4,"處女":5,"天秤":6,"天蠍":7,"射手":8,"魔羯":9}
		if(Stype.hasOwnProperty(msg))
		{
			var Today=new Date();
			var Y=Today.getFullYear()
				,M=(parseInt(Today.getMonth())<10) ? "0"+(Today.getMonth()+1) : (Today.getMonth()+1)
				,D=(parseInt(Today.getDate())<10) ? "0"+Today.getDate() : Today.getDate()
			let fullDate= Y+"-"+M+"-"+D
			var url=`http://astro.click108.com.tw/daily_${Stype[msg]}.php?iAcDay=${fullDate}&iAstro=${Stype[msg]}`
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