package websocket.server.connection;

public class ProtocolError {
	
	public static int INVALID_CLIENT_HANDSHAKE = 1000;
	public static int INVALID_CLIENT_HANDSHAKE_CONNNECT = 1001;
	public static int INVALID_CLIENT_HANDSHAKE_UPGRADE = 1002;
	public static int MISSING_CLIENT_HANDSHAKE_KEY = 1003;
	public static int INVALID_CLIENT_HANDSHAKE_VERSION = 1004;
	public static int MISSING_CLIENT_HANDSHAKE_UPGRADE = 1005;
	
}
