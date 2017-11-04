package websocket.test;

import websocket.server.connection.IClientHandler;
import websocket.server.connection.WebSocketServer;

public class TestServer implements IClientHandler {
	
	private WebSocketServer wsServer;
	
	private TestServer(){
		this.wsServer = new WebSocketServer(this, 9001);
		WebSocketServer.startAsThread(wsServer);
	}
	
	public static void main(String[] args) {
		new TestServer();
	}
	
	@Override
	public void onOpen(long sessionId) {
		System.out.println("A connection has been opened! " + sessionId);
	}

	@Override
	public void onClose(long sessionId) {
		System.out.println("A connection has been closed! " + sessionId);
	}

	@Override
	public void onTextMessage(long sessionId, String data) {
		System.out.println("Received " + data.length() + " characters");
		System.out.println("Client " + sessionId + " Message:");
		System.out.println(data);
		
		this.wsServer.sendTextToClient(sessionId, "Hello World " + sessionId + " @ " + System.currentTimeMillis());
	}

	@Override
	public void onBinaryMessage(long sessionId, byte[] data) {
		System.out.println("Received " + data.length + " bytes");
	}

	@Override
	public void onPing(long sessionId) {
		// TODO Auto-generated method stub
		
	}
}
