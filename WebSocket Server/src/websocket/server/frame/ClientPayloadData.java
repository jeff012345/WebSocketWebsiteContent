package websocket.server.frame;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;

public class ClientPayloadData extends PayloadData{
	
	public ClientPayloadData(InputStream in, BigInteger payloadLength, byte[] mask) throws IOException{
		//super(payloadLength);
		
		BigInteger blockSizeBI = BigInteger.valueOf(PayloadBlock.BLOCK_SIZE)
				,four = BigInteger.valueOf(4)
				,bytesRead = BigInteger.ZERO
				,bytesLeft = payloadLength.add(BigInteger.ZERO);
		
		byte[] dataBuffer;
		int readSize;
		BigInteger readSizeBI;
		do {
			if(bytesLeft.compareTo(blockSizeBI) < 1){
				//number of bytes remaining is <= buffer size
				readSize = bytesLeft.intValue();
				readSizeBI = BigInteger.valueOf(readSize);
			}else{
				//number of bytes remaining is greater than buffer size
				readSize = PayloadBlock.BLOCK_SIZE;
				readSizeBI = blockSizeBI;
			}			
			
			dataBuffer = new byte[readSize];
			in.read(dataBuffer);
			
			//unmask data
			for(int i = 0, j = bytesRead.mod(four).intValue(); i < dataBuffer.length; i++, j = (++j) % 4){
				dataBuffer[i] ^= mask[j];
			}
			
			//blocks.add();
			add(new PayloadBlock(dataBuffer));
			
			bytesRead = bytesRead.add(readSizeBI);
			bytesLeft = bytesLeft.subtract(readSizeBI);
			
		}while(bytesLeft.compareTo(BigInteger.ZERO) != 0);
	}
	
}
