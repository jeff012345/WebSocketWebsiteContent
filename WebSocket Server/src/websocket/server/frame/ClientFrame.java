package websocket.server.frame;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;

public class ClientFrame extends Frame{
	
	public static ClientFrame readFrame(InputStream in, BigInteger extensionDataLength) throws IOException{
		ClientFrame f = new ClientFrame();
		
		byte[] inBytes = new byte[2]; 
		in.read(inBytes);
		//System.out.println(Arrays.toString(inBytes));
		f.isFin = !((inBytes[0] & 0x80) == 0); //  0x80 = 10000000  
		f.rsv1 = !((inBytes[0] & 0x40) == 0);  //  0x40 = 01000000  eg.  11100110 & 00100000 = 00100000 == 0 ? false
		f.rsv2 = !((inBytes[0] & 0x20) == 0);  //  0x20 = 00100000
		f.rsv3 = !((inBytes[0] & 0x10) == 0);  //  0x10 = 00010000
		f.opCode = (byte)(inBytes[0] & 0x0F);
		f.isMasked = (inBytes[1] >> 7 == 1);
		
		int len = (inBytes[1] & 0x7f);
		//System.out.println("Length = " + len);
		if(len < 126){
			f.payloadLength = BigInteger.valueOf(len);
		}else if(len == 126){
			in.read(inBytes);
			f.payloadLength = new BigInteger(inBytes);
		}else{
			//len = 127
			inBytes = new byte[8];
			in.read(inBytes);
			f.payloadLength = new BigInteger(inBytes);
		}
		
		//System.out.println("Payload Length = " + f.payloadLength.toString());
		
		f.maskingKey = new byte[4];
		in.read(f.maskingKey);
		
		//System.out.println("Masking Key = " + Arrays.toString(f.maskingKey));
		
		//read data
		if(extensionDataLength != null && extensionDataLength.compareTo(BigInteger.ZERO) == 1){
			//no extension data
			//System.out.println("Reading extension data");
			f.extensionData = new ClientPayloadData(in, extensionDataLength, f.maskingKey);
		}
		
		//System.out.println("Reading application data");
		f.applicationData = new ClientPayloadData(in, f.payloadLength.subtract(extensionDataLength), f.maskingKey);
		
		//System.out.println("Application Data Block length = " + f.applicationData.getData().size());
		
		//System.out.println("Read frame");
		
		return f;
	}
	
}
