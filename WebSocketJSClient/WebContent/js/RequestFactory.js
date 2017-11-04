(function(){
	
	var RequestFactory = {}
	window.RequestFactory = RequestFactory;
	
	/**
	 * @param {string} command
	 */
	function Request(command){
		console.log("Request constructor");
		this.requestUUID = window.wsc.generateUUID();
		this.command = command;
	}
	RequestFactory.Request = Request;
	
	/*============================================
	 * File Request
	 *===========================================*/
	/**
	 * @param uri link to file
	 */
	function File(uri){
		Request.call(this, "file");
		
		console.log("File constructor");
		this.uri = uri;
	}
	File.prototype = Object.create(Request.prototype);
	RequestFactory.File = File;
	
})();