/// <reference path="C:\Users\liufha\typings\globals\node\index.d.ts" />

var net = require('net');
var host = 'come2see.me';//'10.61.41.49';'127.0.0.1';//填入机器B的IP或者域名，这里测试填的是本地域名
var port = 4020;//填入机器B的提供client连接的端口
var client;
var loc;

//登陆时需要验证身份
var https = require('https');
var fs = require('fs');

var options = {
	hostname:host,//'121.201.63.42',
	//hostname:'127.0.0.1',
	//port:8889,
	port:49289,//3088,
	path:'/desktop',
	method:'GET',
	key:fs.readFileSync('./keys/client-key.pem'),
	cert:fs.readFileSync('./keys/client-cert.pem'),
	ca: [fs.readFileSync('./keys/ca-cert.pem')],
	agent:false
};
options.agent = new https.Agent(options);

function auth(){
	var req1 = https.request(options,function(res){
	  console.log("statusCode: ", res.statusCode);
	  console.log("headers: ", res.headers);
	  console.log("statusCode: ", res.statusCode);
	  res.setEncoding('utf-8');
	  res.on('data',function(d){
		console.log(d);
		main();
	  })
	});
	req1.end();
	req1.on('error',function(e){
	  console.log(e);
	})
}
auth();

function main() {
	function connect() {
	  client = net.connect(port,host, function() {
		console.log("代理服务端："+host+':'+port+' 连接成功！');
		loc = net.connect(3389, function() {
		  console.log('本地远程桌面 3389 连接成功！');
		  loc.pipe(client);
		  client.pipe(loc);
		});
		loc.on('close', function() {
		  delete(loc);
		  if(client) client.end();
		  console.log('local 3389 disconnected');
		});
	  });
	  client.on('error', function() {
		console.log("代理服务端："+host+':'+port+' 连接失败，正在重试...');//需要重新认证
		//auth();
		setTimeout(connect,5000);
	  });
	  client.on('close', function() {
		delete(client);
		if(loc)loc.end();
		console.log(host+':'+port+' 代理连接已关闭');
		setTimeout(connect,100);
	  });
	}
	connect();
	process.title = '客户端';
	return;
}