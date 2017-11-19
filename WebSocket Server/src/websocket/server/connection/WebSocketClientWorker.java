package websocket.server.connection;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.net.Socket;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.LinkedList;

import javax.xml.bind.DatatypeConverter;

import websocket.server.frame.ClientFrame;
import websocket.server.frame.OpCodes;
import websocket.server.frame.PayloadBlock;
import websocket.server.frame.PayloadData;
import websocket.server.frame.ServerFrame;
import websocket.server.frame.StatusCodes;
import websocket.webserver.util.Logger;

/**
 * Handles interactions with the client
 * @author Jeff
 *
 */
public class WebSocketClientWorker extends Thread {
	
	private static Logger LOG = new Logger(WebSocketClientWorker.class);
	
	public static final String MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	public static final int TIMEOUT_MILLISECONDS = 60 * 120 * 1000;
	
	private Socket clientSocket;
	private OutputStream clientOutput;
	private WebSocketServer server;
	private boolean keepAlive = true;
	private boolean isClosed;
	private MessageDigest md;
	private String clientKey;
	private IClientHandler handler;
	
	private LinkedList<ClientFrame> frameBuffer;
	
	protected WebSocketClientWorker(Socket clientSocket, WebSocketServer server, IClientHandler handler) 
			throws IOException, NoSuchAlgorithmException{
		this.clientSocket = clientSocket;
		this.server = server;
		this.handler = handler;
		frameBuffer = new LinkedList<ClientFrame>();
		md = MessageDigest.getInstance("SHA-1");
	}
	
	@Override
	public void run(){
		LOG.log("Starting client thread");
		
		try {
			InputStream is = clientSocket.getInputStream();
			clientOutput = clientSocket.getOutputStream();
			InputStreamReader isr = new InputStreamReader(is);
			BufferedReader br = new BufferedReader(new InputStreamReader(is));
			isClosed = false;
			
			String line = null;
			LinkedList<String> handshake = new LinkedList<String>();
			while((line = br.readLine()) != null && br.ready()){
				handshake.add(line);
			}
			
			onClientHandshake(handshake);
			
			synchronized(handler){
				handler.onOpen(this.getId());
			}
			
			long start = System.currentTimeMillis();
			
			//try {
				while(keepAlive && !clientSocket.isInputShutdown() 
						&& System.currentTimeMillis() - start < TIMEOUT_MILLISECONDS){
					//LOG.log("Wait for inputstream ready... " + System.currentTimeMillis());
					//Thread.sleep(100);
					
					int firstByte = is.read();
					if(firstByte == -1) {
						keepAlive = false;
						break;
					}
					
					LOG.log("Reading Bytes...");
					onFrameStart(firstByte, is);
				}
				LOG.log("client '" + this.clientKey + "' shutting down");
			//}catch(InterruptedException e){
			//	e.printStackTrace();
			//}
		} catch (IOException e) {
			e.printStackTrace();
		}finally{
			close(StatusCodes.NORMAL_CLOSURE);
		}
	}
	
	public void close(int reason){
		LOG.log(System.currentTimeMillis() + ": Closing Client. Reason = " + reason);
		
		if(isClosed)
			return;
		
		isClosed = true;
		keepAlive = false;
		
		sendCloseFrame(reason);
		
		try {
			clientSocket.close();
			LOG.log("Client Closed" + System.currentTimeMillis());
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		//notify handler
		synchronized(handler){
			handler.onClose(this.getId());
		}
		
		//notify server
		server.clientClose(this);
	}
	
	private void sendCloseFrame(int reason){
		if(isClosed)
			return;
		
		//TODO set the reason in the close frame??
		ServerFrame close = ServerFrame.Close();
		try {
			close.send(clientOutput);
			LOG.log("Sent Close Frame!");
		} catch (IOException e) {
			e.printStackTrace();
			// this could cause infinite loop
			//close(StatusCodes.GOING_AWAY);
		}
	}
	
	private void sendPong(){
		ServerFrame pong = ServerFrame.Pong();
		try {
			pong.send(clientOutput);
			LOG.log("Sent Pong!");
		} catch (IOException e) {
			e.printStackTrace();
			close(StatusCodes.GOING_AWAY);
		}
	}
	
	private void protocolError(int e){
		System.err.println("PROTOCOL ERROR " + e);
		close(StatusCodes.GOING_AWAY);
	}

	/*
	 * 
   1.   The handshake MUST be a valid HTTP request as specified by
        [RFC2616].

   2.   The method of the request MUST be GET, and the HTTP version MUST
        be at least 1.1.

        For example, if the WebSocket URI is "ws://example.com/chat",
        the first line sent should be "GET /chat HTTP/1.1".

   3.   The "Request-URI" part of the request MUST match the /resource
        name/ defined in Section 3 (a relative URI) or be an absolute
        http/https URI that, when parsed, has a /resource name/, /host/,
        and /port/ that match the corresponding ws/wss URI.

   4.   The request MUST contain a |Host| header field whose value
        contains /host/ plus optionally ":" followed by /port/ (when not
        using the default port).

   5.   The request MUST contain an |Upgrade| header field whose value
        MUST include the "websocket" keyword.
	 */
	private void onClientHandshake(LinkedList<String> handshake) {
		LOG.log("Recieved Client Handshake");
		
		String first = handshake.pop().toUpperCase();
		if((!first.contains("GET") && !first.contains("CONNECT"))
				|| (!first.contains("HTTP/1.1") && !first.contains("HTTPS/1.1"))){
			protocolError(ProtocolError.INVALID_CLIENT_HANDSHAKE_CONNNECT);
			return;
		}
		
		HashMap<String, String> headers = new HashMap<String, String>();
		for(String line : handshake){
			int colonIndex = line.indexOf(':');
			String key = line.substring(0, colonIndex).toLowerCase();
			String value = line.substring(colonIndex + 1).trim();
			//LOG.log(key + " = " + value);
			headers.put(key, value);
		}
		
		if(headers.containsKey("upgrade")){
			if(!headers.get("upgrade").toLowerCase().contains("websocket")){
				protocolError(ProtocolError.INVALID_CLIENT_HANDSHAKE_UPGRADE);
				return;
			}
		}else{
			protocolError(ProtocolError.MISSING_CLIENT_HANDSHAKE_UPGRADE);
			return;
		}
		
		if(headers.containsKey("sec-websocket-key")){
			clientKey = headers.get("sec-websocket-key").trim();
			LOG.log("Client Key = " + clientKey);
		}else{
			protocolError(ProtocolError.MISSING_CLIENT_HANDSHAKE_KEY);
			return;
		}
		
		if(headers.containsKey("sec-websocket-version")){
			if(!headers.get("sec-websocket-version").equals("13")){
				//sendHTTPProtocolError(); ?????	
				protocolError(ProtocolError.INVALID_CLIENT_HANDSHAKE_VERSION);
			}
		}
		
		try {
			sendServerHandshake();
		} catch (IOException e) {
			e.printStackTrace();
			close(StatusCodes.SERVER_TERMINATING_UNFULFULLIBLE_REQUEST);
		}
	}
	
	private void sendServerHandshake() throws IOException {
		LOG.log("Sending Server Handshake");
		
		String accept = clientKey + MAGIC_STRING;		
		accept = DatatypeConverter.printBase64Binary(md.digest(accept.getBytes()));
		//LOG.log("accept = " + accept);
		
		PrintWriter pw = new PrintWriter(clientSocket.getOutputStream());
		pw.println("HTTP/1.1 101 Switching Protocols");
		pw.println("Upgrade: websocket");
		pw.println("Connection: upgrade");
		pw.println("Sec-WebSocket-Accept: " + accept);
		pw.println("");
		pw.flush();
		LOG.log("Sent Server Handshake");
	}
	
	private void onFrameStart(int firstByte, InputStream in) {
		//LOG.log("Received Client Frame Start!");
		
		try {
			//LOG.log("Read Stream");
			ClientFrame f = ClientFrame.readFrame(firstByte, in, BigInteger.ZERO);
			frameBuffer.add(f);
			if(f.isFin()){
				//LOG.log("frame is fin");
				f = frameBuffer.getFirst();
				switch(f.getOpCode()){
				case OpCodes.BINARY_FRAME:
					onBinaryFrame();
					break;
				case OpCodes.TEXT_FRAME:
					onTextFrame();
					break;
				case OpCodes.CONNECTION_CLOSE:
					onConnectionClose(StatusCodes.NORMAL_CLOSURE);
					break;
				case OpCodes.PING:
					onPing();
					break;
				default:
					onFrameOther();
					break;
				}
			}			
			//LOG.log("\r\nEnd of Read Stream");
		} catch (IOException e) {
			e.printStackTrace();
			close(StatusCodes.GOING_AWAY);
		}
	}
	
	public synchronized void sendTextMessage(String data){
		ServerMessage sm = new ServerMessage(data);
		sendServerMessage(sm);
	}
	
	public synchronized void sendServerMessage(ServerMessage sm){
		try {
			for(ServerFrame f : sm.getFrames()){
				f.send(clientOutput);
			}
		} catch (IOException e) {
			e.printStackTrace();
			close(StatusCodes.GOING_AWAY);
		}
		LOG.log("sendServerMessage end");
	}
	
	public synchronized void sendByteMessage(byte[] data){
		ServerMessage sm = new ServerMessage(data);
		
		try {
			for(ServerFrame f : sm.getFrames()){
				f.send(clientOutput);
			}
		} catch (IOException e) {
			e.printStackTrace();
			close(StatusCodes.GOING_AWAY);
		}
	}
	
	/**
	 * handles the text frames and notifies the handler
	 */
	private void onTextFrame(){
		//LOG.log("onTextFrame ");
		StringBuilder sb = new StringBuilder();
		long len = 0;
		String s;
		
		for(ClientFrame f : frameBuffer){
			for(PayloadBlock pb : f.getApplicationData().getData()){
				s = new String(pb.getData());
				len += s.length();
				
				if(len < Integer.MAX_VALUE){
					sb.append(s);
				}else{
					break;
				}
			}
		}
		frameBuffer.clear();
		
		synchronized (handler) {
			handler.onTextMessage(getId(), sb.toString());
		}
	}
	
	/**
	 * handles the binary frames and notifies the handler
	 */
	private void onBinaryFrame(){
		BigInteger totalMessageLength = BigInteger.ZERO;
			
		LOG.log("Binary Frame");
		for(ClientFrame f : frameBuffer){
			totalMessageLength.add(f.getApplicationData().getPayloadLength());
		}
		
		if(totalMessageLength.compareTo(BigInteger.valueOf(Integer.MAX_VALUE)) == 1){
			System.err.println("Message is too big. Greater than max integer value.");
			return;
		}
		
		byte[] data = new byte[totalMessageLength.intValue()];
		int position = 0;
		
		for(ClientFrame f : frameBuffer){
			PayloadData pd = f.getApplicationData();
			byte[] blockData;
			for(PayloadBlock pb : pd.getData()){
				blockData = pb.getData();
				System.arraycopy(blockData, 0, data, position, blockData.length);
				position += blockData.length;
			}
		}
		
		frameBuffer.clear();
		
		synchronized (handler) {
			handler.onBinaryMessage(getId(), data);
		}
	}
	
	private void onConnectionClose(int reason){
		LOG.log("Client Close Frame");
		close(reason);
	}
	
	private void onPing(){
		LOG.log("Ping!");
		sendPong();
	}
	
	private void onFrameOther(){
		for(ClientFrame f : frameBuffer){
			f.getOpCode();
		}
		frameBuffer.clear();
	}
	
	public long getId(){
		return super.getId();
	}
}
