package websocket.webserver.handlers;

import java.util.Map;

import websocket.webserver.ServerResponse;

public class InvalidHandler implements IClientMessageHandler {

	@Override
	public ServerResponse handle(Map<String, Object> sessionData, String data) {
		return ServerResponse.error("Invalid handler added for command. Handler must have no argument constructor.");
	}

}
