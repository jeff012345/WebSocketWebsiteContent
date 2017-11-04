package websocket.server.frame;

import java.io.UnsupportedEncodingException;

public class PayloadBlock {
	
	public static final int BLOCK_SIZE = 512;
	//private static final int BLOCK_SIZE = 6;
	
	private byte[] data;
	private int length;
	
	public PayloadBlock(byte[] data, int length){
		this.data = data;
		this.length = length;
	}
	
	public PayloadBlock(byte[] data){
		this.data = data;
		this.length = data.length;
	}
	
	/**
	 * 
	 * @param data Must be UTF-8 encoded string. WebSocket requires it?
	 */
	public PayloadBlock(char[] data){
		try {
			this.data = (new String(data)).getBytes("UTF-8");
			this.length = this.data.length;
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		
		/*this.length = data.length * 2; //chars are 16 bit
		this.data = new byte[this.length];
		
		if(this.length > 0){
			for(int i = 0, j = 0; i < data.length; i++, j += 2){
				this.data[j] = (byte)(data[i] >> 8); //first byte
				this.data[j + 1] = (byte)data[i]; //second byte
			}
		}*/
	}
	
	public byte[] getData(){
		return data;
	}
	
	public int getLength(){
		return length;
	}
	
}
