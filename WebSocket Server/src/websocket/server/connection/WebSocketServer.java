package websocket.server.connection;

import java.io.IOException;
import java.net.ServerSocket;
import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map.Entry;

import websocket.server.frame.StatusCodes;
import websocket.webserver.util.Logger;

/**
 * Host WebSocket server. Possible to serve up to 2^63-1 (Max Java Long) clients. I hope you have a lot of RAM...
 * @author Jeff
 *
 */
public class WebSocketServer implements Runnable {
	
	public static final Logger LOG = new Logger(WebSocketServer.class);
	
	public static final int DEFAULT_PORT = 8000;
	
	//TODO cap frame size
	//TODO cap sequential frames
	//TODO close client when receiving an unmasked client frame. server send close with protocol error 1002
	//TODO respect request origin
	//TODO extension data not fully supported throughout library
	
	private ServerSocket serverSocket = null;
	private int port;
	private IClientHandler handler;
	private HashMap<Long, WebSocketClientWorker> clients;
	private boolean keepAlive = true;
	
	public WebSocketServer(IClientHandler handler, int listeningPort){
		init(handler, listeningPort);
	}
	
	public WebSocketServer(IClientHandler handler){
		init(handler, WebSocketServer.DEFAULT_PORT);
	}
	
	private void init(IClientHandler handler, int listeningPort){
		port = listeningPort;
		clients = new HashMap<>();
		this.handler = handler;
	}
	
	@Override
	public void run() {
		try {
			this.openConnection();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (Exception e2) {
			this.close();
			System.exit(-1);
		}
	}
	
	public void close(){
		LOG.log("Closing Server");
		keepAlive = false;
		if(serverSocket != null){
			try {
				LOG.log("Closing all clients");
				for(Entry<Long, WebSocketClientWorker> e : clients.entrySet()){
					e.getValue().close(StatusCodes.GOING_AWAY);
				}
				
				serverSocket.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
	
	public HashMap<Long, WebSocketClientWorker> getClients(){
		return clients;
	}
	
	public int getPort(){
		return port;
	}
	
	//called by threads
	protected synchronized void clientClose(WebSocketClientWorker client){
		LOG.log("Client told server it's closed");
		if(client == null){
			LOG.log("Client was null?????");
		}else{
			LOG.log("Client Size = " + clients.size());
			clients.remove(client.getId());
			LOG.log("Client Size = " + clients.size());
		}
	}
	
	private void openConnection() throws IOException{
		LOG.log("Opening Server Connection on Port " + this.port);
		
		serverSocket = new ServerSocket(port);
		
		WebSocketClientWorker client;
		while(keepAlive){
			try {
				client = new WebSocketClientWorker(serverSocket.accept(), this, handler);				
				(new Thread(client)).start();
				clients.put(client.getId(), client);
				LOG.log("Client Size = " + clients.size());
			} catch (NoSuchAlgorithmException e) {
				e.printStackTrace();
			}
		}
	}
	
	public WebSocketClientWorker getClient(long sessionId){
		return clients.get(sessionId);
	}
	
	public boolean sendTextToClient(long sessionId, String data){
		LOG.log("Send text message to " + sessionId + " with content length " + data.length());
		return sendMessageToClient(sessionId, new ServerMessage(data));
	}
	
	public boolean sendBinaryToClient(long sessionId, byte[] data){
		return sendMessageToClient(sessionId, new ServerMessage(data));
	}
	
	public boolean sendTextToAllClients(String data){
		return sendMessageToAll(new ServerMessage(data));
	}
	
	public boolean sendBinaryToAllClients(byte[] data){
		return sendMessageToAll(new ServerMessage(data));
	}
	
	public boolean sendBinaryToAllClients(Collection<Byte> data){
		byte[] binaryData = new byte[data.size()];
		
		Iterator<Byte> i = data.iterator();
		int pos = 0;
		while(i.hasNext()){
			binaryData[pos] = i.next();
			pos++;
		}
		
		return sendBinaryToAllClients(binaryData);
	}
	
	public synchronized boolean sendMessageToClient(long sessionId, ServerMessage sm){
		LOG.log("Sending message to client = " + sessionId);
		WebSocketClientWorker client = clients.get(sessionId);
		
		if(client != null){
			client.sendServerMessage(sm);
			return true;
		}else{
			System.err.println("Invalid session ID");
			return false;
		}
	}
	
	public boolean sendMessageToAll(ServerMessage sm){
		for(WebSocketClientWorker client : this.clients.values()){
			client.sendServerMessage(sm);
		}
		return true;
	}
	
	public static Thread startAsThread(WebSocketServer webSocketServer){
		Thread t = new Thread(webSocketServer);
		t.start();
		return t;
	}
}
