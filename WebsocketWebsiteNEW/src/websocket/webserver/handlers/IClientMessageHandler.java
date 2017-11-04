package websocket.webserver.handlers;

import java.util.Map;

import websocket.webserver.ServerResponse;

public interface IClientMessageHandler {
	
	public ServerResponse handle(Map<String, Object> sessionData, String clientMessage);
	
}
