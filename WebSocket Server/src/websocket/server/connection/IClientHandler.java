package websocket.server.connection;

public interface IClientHandler {
	
	public void onOpen(long sessionId);
	public void onClose(long sessionId);
	public void onTextMessage(long sessionId, String data);
	public void onBinaryMessage(long sessionId, byte[] data);
	public void onPing(long sessionId);
	
}
