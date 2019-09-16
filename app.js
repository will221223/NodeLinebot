const linebot = require('linebot');
const express = require('express');

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

bot.on('message', function(event) {
    // if (event.message.type = 'text') {
    //     let msg = event.message.text;
    //     event.reply(msg).then(function(data) {
    //         console.log('測試回一樣的話')
    //     }).catch(function(error) {
    //         console.log('錯誤產生，錯誤碼：'+error);
    //     });
    // }
    var Stype={"水瓶":10,"雙魚":11,"牡羊":0,"金牛":1,"雙子":2,"巨蟹":3,"獅子":4,"處女":5,"天秤":6,"天蠍":7,"射手":8,"魔羯":9}
		if(Stype.hasOwnProperty(event.message.text))
		{
			var Today=new Date();
			var Y=Today.getFullYear()
				,M=(parseInt(Today.getMonth())<10) ? "0"+(Today.getMonth()+1) : (Today.getMonth()+1)
				,D=(parseInt(Today.getDate())<10) ? "0"+Today.getDate() : Today.getDate()
			let fullDate= Y+"-"+M+"-"+D
			var url=`http://astro.click108.com.tw/daily_${Stype[event.message.text]}.php?iAcDay=${fullDate}&iAstro=${Stype[event.message.text]}`
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
        
    switch (event.message.type) {
	
		case 'text':
			switch (event.message.text) {
				// case '!help':
				// const txt="指令：\r\n!張智清\r\n抽辣妹\r\n大家早\r\n嘉文神1\r\n嘉文神2\r\n智清秀操作\r\n特別新增指令「抽帥哥」造福女性"
				// //const txt=process.env.HelpCMD;
				// return event.reply(txt)
				// break;
				
				case '二哈':
					return event.reply('愛吃屎')
					break;
				case '安安':
				return event.reply('安')
				break;
				case '吃什麼':
				return event.reply('屎')
				break;	
        }
    }
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