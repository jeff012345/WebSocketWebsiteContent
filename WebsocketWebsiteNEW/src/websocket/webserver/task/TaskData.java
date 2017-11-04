package websocket.webserver.task;

import java.util.concurrent.ConcurrentHashMap;

import websocket.webserver.handlers.IClientMessageHandler;

public class TaskData {
	public long sessionId;
	public ConcurrentHashMap<String, Object> sessionData;
	public Class<? extends IClientMessageHandler> handler;
	public String clientMessage;
	
	public TaskData(long sessionId, ConcurrentHashMap<String, Object> sessionData,
			Class<? extends IClientMessageHandler> handler, String clientMessage) {
		super();
		this.sessionId = sessionId;
		this.sessionData = sessionData;
		this.handler = handler;
		this.clientMessage = clientMessage;
	}
	
	
}
