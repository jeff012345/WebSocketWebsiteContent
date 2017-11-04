(function(){
	
	function WSWidget(webSocketClient){
		this.webSocketClient = webSocketClient;
		this.data = {};
		
		this._create();
	}
	window.WSWidget = WSWidget;
	
	WSWidget.prototype._create = function(){
		
	}
	
})();