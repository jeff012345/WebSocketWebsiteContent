(function(){
	
	var wsc = {};
	window.wsc = wsc;
	
	var promises = {};
	promises.length = 0;
	
	var loaded = {};
	var waiting = [];
	var body = document.getElementsByTagName("body")[0];
	var decoder = new TextDecoder("utf-8");
	
	var loadFiles = true;
	
	wsc._load = undefined
	
	//wsc._ws = new WebSocket("ws://ec2-13-58-47-69.us-east-2.compute.amazonaws.com:9001");
	wsc._ws = new WebSocket("ws://localhost:9001");
	wsc._ws.binaryType = "arraybuffer";
	
	wsc._ws.onopen = function(){
		if(wsc._load === undefined){
			wsc._load = true;
		} else {
			wsc._load();
		}
	};
	
	wsc.readyLoad = function(fn){
		if(wsc._load === true){
			fn();
			return;
		}
		
		wsc._load = fn;
	};

	wsc.onComplete = function(){};
	
	wsc._ws.onmessage = function(e){
		if(e.data === undefined)
			return;
		
		var msg = JSON.parse(decoder.decode(new Uint8Array(e.data)));
		
		var p = promises[msg.data.requestUUID];
		if(p !== undefined){
			promises.length--;
			delete promises[msg.data.requestUUID];
			p(msg);
		}
	};

	wsc._ws.onclose = function(){
		console.log("onclose");
		console.log(wsc._ws);
	};
	
	wsc.sendRequest = function(req){
		req.requestTime = (new Date()).getTime();
		var json = JSON.stringify(req);
		
		return new Promise(bind(this, function(resolve, reject){
			promises[req.requestUUID] = bind(this, function(msg, resolve, reject){
				if(msg.status === "OK"){
					resolve(msg.data);
				} else {
					reject(msg.message);
				}
			}, resolve, reject);
			promises.length++;
			this._ws.send(json);
		}));
	};
	
	wsc.close = function(){
		console.log("closing");
		this._ws.close();
	};
	
	wsc.loadJs = function(src, dependencies){
		dependencies = dependencies || [];
		
		var jsUUID = generateUUID();
		
		var jsReq = {
			requestUUID: jsUUID,
			command: "file",
			uri: src	
		};
		
		wsc.sendRequest(jsReq).then(bind(wsc, function(msg, dependencies){
			var load = bind(wsc, function(content, jsUUID){
				if(loadFiles){
					//var script = document.createElement('script');
					//script.innerHTML = atob(content);
					//body.appendChild(script);
					try{
						eval(atob(content));
					}catch(e){
						console.error(e);
					}
				}
				
				loaded[jsUUID] = true;
			}, msg.content, jsUUID);
			
			if(allDependenciesLoaded(dependencies).length === 0){
				load();
				loadDependencies();
			} else {
				waiting.push({ load: load, dependencies: dependencies });
			}
			
		}, dependencies, jsUUID));
		
		return jsUUID;
	};
	
	wsc.loadCss = function(src){
		var req = {
			requestUUID: generateUUID(),
			command: "file",
			uri: src	
		};
		wsc.sendRequest(req).then(function(msg){
			if(loadFiles){
				var element = document.createElement('style');
				element.innerHTML = atob(msg.content);
				body.appendChild(element);
			}
		});
	};
	
	function allDependenciesLoaded(dependencies){
		return dependencies.filter(d => loaded[d] === undefined); // filters to dependencies that have not been loaded
	}
	
	function loadDependencies(){ // ~20ms
		var loaded = false;
		
		waiting = waiting.filter(w => {
			if((w.dependencies = allDependenciesLoaded(w.dependencies)).length === 0){
				w.load();
				loaded = true;
				return false;
			}
			
			return true;
		});
		
		if(loaded){
			// new JS was loaded, so check all the waiting dependencies again
			loadDependencies();
		}
		
		if(waiting.length === 0 && promises.length === 0){
			console.log("all promises finished");
			wsc.onComplete();
		}
	}
	
	function bind(context, fn){
		var fnArgs = [];
		for(var i = 2; i < arguments.length; i++){
			fnArgs.push(arguments[i]);
		}
		
		return function(){
			var args = [];
			for(var i = 0; i < arguments.length; i++){
				args.push(arguments[i]);
			}
			args = args.concat(fnArgs);
			fn.apply(context, args);
		};
	}
	
	function generateUUID() {
	    var d = new Date().getTime() + performance.now();
	    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = (d + Math.random()*16)%16 | 0;
	        d = Math.floor(d/16);
	        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	    });
	    return uuid;
	}
	
})();