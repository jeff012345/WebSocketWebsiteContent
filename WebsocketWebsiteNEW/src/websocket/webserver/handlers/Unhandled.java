package websocket.webserver.handlers;

import java.util.Map;

import websocket.webserver.ServerResponse;

public class Unhandled implements IClientMessageHandler {
	
	@Override
	public ServerResponse handle(Map<String, Object> sessionData, String messageData) {
		return ServerResponse.error("Unhandled Request");
	}
	
}
