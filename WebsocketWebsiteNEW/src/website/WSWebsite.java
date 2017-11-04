package website;

import websocket.webserver.WebSocketWebServer;
import websocket.webserver.handlers.FileMessage;

public class WSWebsite {
	
	public static void main(String[] args) {
		
		WebSocketWebServer server = new WebSocketWebServer(9001);
		
		
		server.registerHandler(FileMessage.COMMAND, FileMessage.class);
	}
	
}
