/// <reference path="C:\Users\liufha\typings\globals\node\index.d.ts" />
var https = require('https');
var fs = require('fs');
var url = require('url');

var options = {
	key: fs.readFileSync('./keys/server-key.pem'),
	ca: [fs.readFileSync('./keys/ca-cert.pem')],
	cert: fs.readFileSync('./keys/server-cert.pem')
};
var desktop_client_port = 4020;//填入供反向客户Server端的client连接端口 //需要跟下面的client数组对应，应该是一个端口范围，比如800-5000，每次连接分配一个对应端口号
var remote_user_port = 8889;//填入服务端对外提供的远程桌面端口，远程桌面客户端需要连接到此端口
var desktop_client_ip = null;
var remote_user_ip = null;

function isIpv4(ip)  
{  
    var re =  /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/  
    return re.test(ip);  
}  

function getIpv4FromIpv6(ipAddrStr){
	var addr_array = ipAddrStr.split(':');
	if( addr_array[0] == '' && addr_array[1] == '' && addr_array[2] == 'ffff' ){
		if( isIpv4(addr_array[3]) ){
			return addr_array[3];
		}
	}
	return null;
}

function ipToV4(ipAddrStr){
	if( isIpv4(ipAddrStr) ){
		return ipAddrStr;
	}else{
		return getIpv4FromIpv6(ipAddrStr);
	}
}

https.createServer(options,function(req,res){
	console.log(req.url,req.socket.remoteAddress);
	if(req.url=='/desktop'){//因为使用了证书，所以能从https连接进来的终端是可靠的
		desktop_client_ip = req.socket.remoteAddress;//req.headers.host;
		console.log(desktop_client_ip);
	}else if(req.url=='/remoteUser'){
		remote_user_ip = req.socket.remoteAddress;//req.headers.host;
		console.log(remote_user_ip);
	}
	res.writeHead(200);
	res.end('auth finished!');
}).listen(49289,'come2see.me');//'10.61.41.49');//'127.0.0.1');//'10.61.115.22');10.61.41.49

function main() {
	var net = require('net');
	var desktop_client = null;//远程连接  //使用数组来存储众多客户Server端链接，根据端口号索引到数组元素client
	var user_client = null;
	net.createServer(function(socket) {//供反向客户端连接
		console.log('socket.remoteAddress:',socket.remoteAddress);
		rmt_addr = ipToV4(socket.remoteAddress);
		dkp_addr = ipToV4(desktop_client_ip);
		if(rmt_addr == dkp_addr	|| '127.0.0.1' == dkp_addr 
				|| '10.61.41.49' == dkp_addr){
			console.log('socket.remoteAddress:',rmt_addr);
			desktop_client = socket;
			console.log('connection '+socket.remoteAddress+':'+socket.remotePort+' connected \n已连通，现在可以远程桌面连接到本机的'+remote_user_port+'端口了！');
			socket.on('close', function() {
				console.log('connection '+socket.remoteAddress+':'+socket.remotePort+' disconnected\n等待客户端连接中...');
				delete(desktop_client);
			});
			socket.on('error',function(){
				console.log('desktop connection error!');
			});
		}else{//connection already established
			socket.end('need auth first!');
			console.log('need auth first!');
		}
	}).listen(desktop_client_port, function() {
		console.log('代理服务端已开启： '+desktop_client_port);
		return;
	});

	net.createServer(function(socket) {//供代理远端用户连接
	  console.log(socket.remoteAddress, remote_user_ip);
	  if(!desktop_client) {//如果远端桌面还没有连接或者远端用户没有通过https验证，则结束远端用户连接
			socket.end('Remote Desktop is not connected!');
			console.log('Remote Desktop is not connected!');
			return;
	  }
	  var rmt_addr = ipToV4(socket.remoteAddress);
	  var rmt_usr_addr = ipToV4(remote_user_ip);
	  if(rmt_addr!=rmt_usr_addr) {//如果远端桌面还没有连接或者远端用户没有通过https验证，则结束远端用户连接
			socket.end('need auth first!');
			console.log('need auth first!');
			return;
	  }
	  socket.pipe(desktop_client);
	  desktop_client.pipe(socket);
	  socket.on('close', function() {
		if(desktop_client)desktop_client.end('user connection closed!');
	  });
	  socket.on('error',function(){
		if(desktop_client)desktop_client.end('user connection error!');
		console.log('user connection error!');
	  });
	}).listen(remote_user_port, function() {
	  console.log('本机远程桌面端口已开启：'+remote_user_port +'\n等待客户端连接中...');
	});
	process.title = '服务端';
	return;
}
main();