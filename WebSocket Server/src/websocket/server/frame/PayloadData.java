package websocket.server.frame;

import java.math.BigInteger;
import java.util.LinkedList;

public class PayloadData {
	
	private LinkedList<PayloadBlock> blocks;
	private BigInteger payloadLength;
	
	protected PayloadData(){
		this.payloadLength = BigInteger.ZERO;
		blocks = new LinkedList<PayloadBlock>();
	}
	
	public LinkedList<PayloadBlock> getData(){
		return blocks;
	}
	
	public BigInteger getPayloadLength(){
		return payloadLength;
	}
	
	public void add(PayloadBlock block){
		blocks.add(block);
		payloadLength = payloadLength.add(BigInteger.valueOf(block.getLength()));
	}
	
}
