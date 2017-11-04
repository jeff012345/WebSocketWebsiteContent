package websocket.server.frame;

import java.math.BigInteger;

public class ServerApplicationPayloadData extends PayloadData{
	
	public static final BigInteger MAX_LENGTH = BigInteger.valueOf(2).pow(64);
	private BigInteger spaceLeft;
	
	public ServerApplicationPayloadData(PayloadData extensionData){
		spaceLeft = MAX_LENGTH.subtract(extensionData.getPayloadLength());
	}
	
	public ServerApplicationPayloadData(){
		spaceLeft = MAX_LENGTH;
	}
	
	public boolean addPayload(byte[] data){
		return addPayload(new PayloadBlock(data, data.length));
	}
	
	public boolean addPayload(PayloadBlock block){
		BigInteger len = BigInteger.valueOf(block.getLength());
		
		if(spaceLeft.compareTo(len) != 1){
			/*blocks.add(block);
			payloadLength.add(len);*/
			super.add(block);
			spaceLeft.subtract(len);
			return true;
		}
		return false;		
	}
	
	public BigInteger spaceLeft(){
		return spaceLeft;
	}
	
}
