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
    switch (msg){
    case (msg.substr(0,4)=='學說話;'):
    {
        let received_text  = msg.slice(4)
        let semicolon_index = received_text.indexOf(';')
            if(semicolon_index == -1){
                return '是不是沒有加分號;咧？汪！'
            }
        let keyword = received_text.substr(0,semicolon_index)
        let message = received_text.slice(semicolon_index+1)
        
        msg= 'keyword=' + keyword + ', message='+message
        lineMsgDB.push({keyword:keyword,message:message})
        return '我學會啦～'
        break;
    }
    case '笑話':
            let rm= Math.floor(Math.random() * ( Math.floor(12) - Math.ceil(1))) + Math.ceil(1);
            var url=`http://joke.876.tw/show/list_${rm}_${rm}.shtml`
            request(url, (err, res, body) => {
            // 把 body 放進 cheerio 準備分析
                const $ = cheerio.load(body)
                let weathers = []
                $('.jlist dd a').each(function(i, elem) {
                    weathers.push($(this).attr("href"))
                })
                let rjoke=weathers[Math.floor(Math.random()*weathers.length)];
                url=`http://joke.876.tw/show/${rjoke}`
                request(url, (err, res, body) => {
                    // 把 body 放進 cheerio 準備分析
                    const $ = cheerio.load(body)
                    let weathers = $('.arts_c').text().replace($('p.lnart').text(),"").replace($('p.jtime').text(),"")//$('.arts_c:not(p.jtime)').text()//.not('p.jtime').not('p.lnart').text()//$('.arts_c').not('p.jtime').not('p.lnart').text()
                    let title=$('.arts_f .arts h1').text();
                    return event.reply(title+"\r\n\r\n"+weathers.replace('\n','').replace('\t',"").trim());
                    //console.log(title+"\r\n\r\n"+weathers.replace('\n','').replace('\t',"").trim())
                })

            })
            break;
    default:
        {
        try{
        return await checkDB(msg)
        }catch(reject){
            return reject
        }
        break;
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