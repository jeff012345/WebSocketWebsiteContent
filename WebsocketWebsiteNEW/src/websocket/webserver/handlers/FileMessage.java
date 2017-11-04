package websocket.webserver.handlers;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.Map;
import java.util.zip.DeflaterInputStream;

import org.apache.commons.io.IOUtils;

import com.google.gson.Gson;

import websocket.webserver.ClientMessage;
import websocket.webserver.ServerResponse;

public class FileMessage implements IClientMessageHandler {
	
	//private static final Logger LOG = new Logger(FileMessage.class);
	
	public static final String COMMAND = "file";
	
	public static String WWW_ROOT = "C:\\Users\\Jeff\\Google Drive\\Graduate\\2017.3 Fall\\ECE574\\project\\workspace\\WebSocketJSClient\\WebContent\\testFiles\\";
	//public static String WWW_ROOT = "/var/www/html/WebContent/testFiles/";
	
	private Gson gson;
	
	public FileMessage(){
		gson = new Gson();
	}
	
	public ServerResponse handle(Map<String, Object> sessionData, String clientMessageData) {
		RequestData clientMessage = gson.fromJson(clientMessageData, RequestData.class);
		
		ServerResponse.Status status = ServerResponse.Status.OK;
		
		ResponseData response = new ResponseData(clientMessage);
		response.uri = clientMessage.uri;
		response.httpCode = 200;
				
		try {
			FileInputStream fis = new FileInputStream(WWW_ROOT + clientMessage.uri);			
			response.content = Base64.getEncoder().encodeToString(IOUtils.toByteArray(fis));
			//Deflater compresser = new Deflater();
			//compresser.setInput(IOUtils.toByteArray(fis));
			//compresser.finish();
			//byte[] output = new byte[50];
			//int compressedDataLength = compresser.deflate(output);
		    //compresser.end();
		    
			//DeflaterInputStream dis = new DeflaterInputStream(fis);
			//response.content = Base64.getEncoder().encodeToString(IOUtils.toByteArray(dis));
			//dis.close();
			//LOG.log(response.content);
			
			//response.content = IOUtils.toString(fis, "UTF-8");
			fis.close();
			
		} catch (FileNotFoundException e) {
			response.content = "File not found.";
			response.httpCode = 404;
			status = ServerResponse.Status.ERROR;
			e.printStackTrace();
		} catch (IOException e) {
			response.content = "Internet Server Error.";
			response.httpCode = 500;
			status = ServerResponse.Status.ERROR;
			e.printStackTrace();
		} 
		
		/*try {
			long sleepTime = (long)(Math.random() * 10000 + 1000);
			System.out.println("sleeping " + clientMessage.uri + " for " + sleepTime);
			Thread.sleep(sleepTime);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}*/
		
		return new ServerResponse(status, gson.toJsonTree(response));
	}
	
	private class RequestData extends ClientMessage {
		private String uri;
	}
	
	@SuppressWarnings("unused")
	private class ResponseData extends ClientRepsonse {
		private String uri;
		private String messageGuid;
		private int httpCode;
		private String content;	
		
		public ResponseData(MessageBase data){
			super(data);
		}
	}
	
}
