package websocket.webserver;

import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;

import com.google.gson.Gson;

import websocket.server.connection.IClientHandler;
import websocket.server.connection.WebSocketServer;
import websocket.webserver.handlers.IClientMessageHandler;
import websocket.webserver.handlers.Unhandled;
import websocket.webserver.task.TaskLooper;
import websocket.webserver.util.Logger;

public class WebSocketWebServer implements IClientHandler {
	
	private static final Logger LOG = new Logger(WebSocketWebServer.class);
	
	private WebSocketServer wsServer;
	private HashMap<String, Class<? extends IClientMessageHandler>> handlers;
	private HashMap<Long, ConcurrentHashMap<String, Object>> sessionData;
	private Gson gson;
	private TaskLooper taskLooper;
	private Logger logger;
	private int listeningPort;
	
	private Class<? extends IClientMessageHandler> unhandled;
	
	public WebSocketWebServer(int port){
		this.listeningPort = port;
		
		sessionData = new HashMap<Long, ConcurrentHashMap<String, Object>>();
		handlers = new HashMap<String, Class<? extends IClientMessageHandler>>();
		gson = new Gson();
		logger = new Logger(WebSocketWebServer.class.getName());
		
		unhandled = Unhandled.class;
		
		//Logger.FILTER_BY_CLASS_NAME = TaskLooper.class.getName();
		
		wsServer = new WebSocketServer(this, this.listeningPort);
		(new Thread(wsServer)).start();
		
		taskLooper = new TaskLooper(wsServer);
		(new Thread(taskLooper)).start();
	}
	
	public void registerHandler(String command, Class<? extends IClientMessageHandler> handler){
		handlers.put(command, handler);
	}
	
	public void setUnhandled(Class<? extends IClientMessageHandler> handler){
		unhandled = handler;
	}
	
	public ConcurrentHashMap<String, Object> getSessionData(long sessionId){
		ConcurrentHashMap<String, Object> data = this.sessionData.get(sessionId);
		
		if(data == null){
			data = new ConcurrentHashMap<String, Object>();
			this.sessionData.put(sessionId, data);
		}
		
		return data;
	}
	
	@Override
	public void onTextMessage(long sessionId, String data) {
		this.logger.log("Received " + data.length() + " characters");
		//this.logger.log("Client " + sessionId + " Message:");
		//this.logger.log(data);
		
		ClientMessage cm = gson.fromJson(data, ClientMessage.class);
		
		if(cm.getCommand() == null){
			cm.setCommand("");
		}
		
		this.logger.log("Recieved command '" + cm.getCommand() + "'");
		
		Class<? extends IClientMessageHandler> handler = handlers.get(cm.getCommand());
		if(handler == null){
			this.logger.log("No handler found!!");
			handler = this.unhandled;
		}
		
		logger.log("using handle = " + handler.getName());
		
		taskLooper.addTask(sessionId, getSessionData(sessionId), handler, data);
	}
	
	@Override
	public void onOpen(long sessionId) {
		LOG.log("A connection has been opened! " + sessionId);
	}

	@Override
	public void onClose(long sessionId) {
		LOG.log("A connection has been closed! " + sessionId);
	}
	
	@Override
	public void onBinaryMessage(long sessionId, byte[] data) {
		LOG.log("Received " + data.length + " bytes");
	}

	@Override
	public void onPing(long sessionId) {
		
	}
	
}
