package websocket.server.frame;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigInteger;

import websocket.webserver.util.Logger;

public class ServerFrame extends Frame {
	
	public static final Logger LOG = new Logger(ServerFrame.class);
	
	public static final BigInteger BI_125 = BigInteger.valueOf(125);
	public static final BigInteger BI_16_BITS = BigInteger.valueOf(0xFFFF); // 16 bits
	
	public ServerFrame(boolean isFin, byte opCode, PayloadData applicationData, PayloadData extensionData){
		this.applicationData = applicationData;
		this.extensionData = extensionData;		
		this.opCode = opCode;
		this.isFin = isFin;
		
		payloadLength = BigInteger.ZERO;
		
		if(extensionData != null){
			payloadLength = payloadLength.add(extensionData.getPayloadLength());
		}
		
		if(applicationData != null){
			payloadLength = payloadLength.add(applicationData.getPayloadLength());
		}
	}
	
	public void send(OutputStream client) throws IOException{
		
		byte[] out = new byte[2];
		byte[] payloadLen = null;
		
		out[0] |= (rsv1 ? 0x40 : 0);
		out[0] |= (rsv2 ? 0x20 : 0);
		out[0] |= (rsv3 ? 0x10 : 0);
		out[0] |= opCode & 0x0F; 
		out[0] |= (isFin ? 0x80 : 0);
				
		//LOG.log("byte[0] = " + byteToString(out[0]));
		
		out[1] |= (isMasked ? 0x80 : 0);
		
		if(payloadLength == null){
			out[1] |= 0;
			client.write(out);
			
		}else if(payloadLength.compareTo(BI_125) < 1){
			out[1] |= payloadLength.byteValue();
			client.write(out);
			
		}else if(payloadLength.compareTo(BI_16_BITS) < 1){
			out[1] |= 0x7E; //126
			client.write(out);
			
			payloadLen = new byte[] { (byte) (payloadLength.intValue() >> 8 & 0xFF), (byte)(payloadLength.intValue() & 0xFF)};
			client.write(payloadLen);
		}else{
			out[1] |= 0x7F; //127
			client.write(out);
			
			payloadLen = payloadLength.toByteArray();
			
			for(int i = 0; i < 8 - payloadLen.length; i++) {
				client.write(0x00);
			}			
			
			client.write(payloadLen);
		}
		
		//LOG.log("byte[1] = " + byteToString(out[1]));
		
		int cnt = 0;
		for(byte b : payloadLen) {
			//LOG.log("payload byte[" + cnt + "] = " + byteToString(b));
			cnt++;
		}
		
		if(extensionData != null){
			//System.out.println("sending extension data");
			for(PayloadBlock pb : extensionData.getData()){
				client.write(pb.getData());
			}
		}
		
		if(applicationData != null){
			//System.out.println("sending applicationData data. blocks = " + applicationData.getData().size());
			for(PayloadBlock pb : applicationData.getData()){
				//System.out.println("Write:" + (new String(pb.getData())));
				client.write(pb.getData());
			}
		}
		client.flush();
		
		LOG.log("Message was sent");
	}
	
	public static ServerFrame Close(){
		return new ServerFrame(true, OpCodes.CONNECTION_CLOSE, null, null);
	}
	
	public static ServerFrame Pong(){
		return new ServerFrame(true, OpCodes.PONG, null, null);
	}
	
	public static String byteToString(byte b) {
		return String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
	}
}
