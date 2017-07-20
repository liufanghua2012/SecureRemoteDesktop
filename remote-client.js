
/// <reference path="C:\Users\liufha\typings\globals\node\index.d.ts" />

var net = require('net');
var host = 'come2see.me';//'121.201.69.157';//'127.0.0.1';//填入机器B的IP或者域名，这里测试填的是本地域名
//var host = '127.0.0.1';
//var host = '192.168.43.57';
var port = 8889;//填入机器B的提供client连接的端口
var client;
var loc;

//登陆时需要验证身份
var https = require('https');
var fs = require('fs');

var options = {
	hostname:host,
	//hostname:'127.0.0.1',
	//port:8889,
	port:49289,
	path:'/remoteUser',
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
	  res.setEncoding('utf-8');
	  res.on('data',function(d){
		console.log(d);
	  });
	});
	req1.end();
	req1.on('error',function(e){
	  console.log(e);
	})
}
auth();