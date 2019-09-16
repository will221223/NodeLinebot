const linebot = require('linebot');
const express = require('express');

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

bot.on('message', function(event) {
    if (event.message.type = 'text') {
        let msg = event.message.text;
        event.reply(msg).then(function(data) {
            console.log('測試回一樣的話')
        }).catch(function(error) {
            console.log('錯誤產生，錯誤碼：'+error);
        });
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
				case '我會好好加油的':
				return event.reply('黃以安瑤瑤黃暐婷APPLE的胸部跟奶好大 打奶泡會超級爽 口交也是 做愛幹黃以安瑤瑤黃暐婷APPLE 24小時也不會累\r\n黃以安瑤瑤黃暐婷APPLE的胸部好大 爆乳 乳溝 黃以安瑤瑤黃暐婷APPLE的身體是我的 黃以安瑤瑤黃暐婷APPLE的處女是我的 幫我口交 幫我打奶砲我要顏射在黃以安瑤瑤黃暐婷APPLE臉上 我要內射 中出 給黃以安瑤瑤黃暐婷APPLE懷孕 當我女友 我會給你爽的 我門來做愛吧\r\n黃以安瑤瑤黃暐婷APPLE一定要幹到黃暐婷APPLE\r\n一定要內射給黃以安瑤瑤黃暐婷APPLE懷孕 才會爽 我會好好的加油的')
				break;	
				case '安安':
				return event.reply('安')
				break;
				case '李俊傑':
				return event.reply('吃狗屌')
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