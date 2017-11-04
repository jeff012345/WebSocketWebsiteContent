package websocket.server.frame;

import java.math.BigInteger;

public class Frame {
	
	protected boolean isFin;
	protected boolean rsv1, rsv2, rsv3;
	protected byte opCode;
	protected boolean isMasked;
	protected BigInteger payloadLength;
	protected byte[] maskingKey;
	
	protected PayloadData applicationData;
	protected PayloadData extensionData;
	
	public Frame(){
		
	}
	
	public PayloadData getApplicationData(){
		return applicationData;
	}
	
	public PayloadData getExtensionData(){
		return extensionData;
	}
	
	public byte getOpCode(){
		return opCode;
	}
	
	public void setFin(boolean isFin){
		this.isFin = isFin; 
	}
	
	public boolean isFin(){
		return this.isFin; 
	}
	
}
