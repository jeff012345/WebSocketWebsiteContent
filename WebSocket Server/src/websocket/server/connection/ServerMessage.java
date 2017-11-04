package websocket.server.connection;

import java.io.UnsupportedEncodingException;
import java.util.LinkedList;

import websocket.server.frame.OpCodes;
import websocket.server.frame.PayloadBlock;
import websocket.server.frame.ServerApplicationPayloadData;
import websocket.server.frame.ServerFrame;

public class ServerMessage{
	
	private LinkedList<ServerFrame> frames;
	
	//FIXME assumes zero length of extension data
	public ServerMessage(String data){
		frames = new LinkedList<ServerFrame>();
		
		try {
			PayloadBlock pb = new PayloadBlock(data.getBytes("UTF-8"));
			
			ServerApplicationPayloadData pd = new ServerApplicationPayloadData();
			pd.add(pb);
			
			System.out.println("string msg length = " + pb.getLength());
			
			ServerFrame sf = new ServerFrame(true, OpCodes.TEXT_FRAME, pd, null);
			frames.add(sf);
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
	}
	
	//FIXME assumes zero length of extension data
	public ServerMessage(byte[] data){
		frames = new LinkedList<ServerFrame>();
		
		PayloadBlock pb = new PayloadBlock(data);
		
		ServerApplicationPayloadData pd = new ServerApplicationPayloadData();
		pd.add(pb);
		
		ServerFrame sf = new ServerFrame(true, OpCodes.BINARY_FRAME, pd, null);
		frames.add(sf);
	}
	
	public LinkedList<ServerFrame> getFrames(){
		return frames;
	}
	
}
