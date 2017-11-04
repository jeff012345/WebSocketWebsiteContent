package websocket.webserver.task;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.concurrent.Semaphore;
import java.util.zip.DeflaterInputStream;

import org.apache.commons.io.IOUtils;

import com.google.gson.Gson;

import websocket.server.connection.WebSocketServer;
import websocket.webserver.ServerResponse;
import websocket.webserver.handlers.IClientMessageHandler;
import websocket.webserver.handlers.InvalidHandler;
import websocket.webserver.util.Logger;

public class HandlerTask implements Runnable {
	
	public static final String CLASS_NAME = HandlerTask.class.getName();
	
	private static final Logger LOG = new Logger(HandlerTask.class);
	
	private Gson gson;
	
	private WebSocketServer webSocketServer;
	
	private TaskLooper taskLooper;
	
	private TaskData taskData;
	
	private boolean isBusy;
	
	private boolean keepAlive;
	
	private Semaphore wait;
	
	public HandlerTask(final WebSocketServer webSocketServer, final TaskLooper taskLooper){
		this.taskLooper = taskLooper;
		//this.logger = new Logger(CLASS_NAME);
		this.gson = new Gson();
		this.webSocketServer = webSocketServer;
		this.isBusy = false;
		this.keepAlive = true;
		this.wait = new Semaphore(1);
	}
	
	@Override
	public void run() {
		try {
			this.wait.acquire();
		} catch (InterruptedException e) {
			e.printStackTrace();
			return;
		}
		
		try {
			while(this.keepAlive) {
				this.wait.acquire();
				
				if(!this.keepAlive)
					return;
				
				runTask();
				this.isBusy = false;
				this.taskLooper.addStartedHandlerToStack(this);
			}
		} catch(InterruptedException e) {
			e.printStackTrace();
		}
	}
	
	private void runTask() {
		long start = System.currentTimeMillis();
		
		IClientMessageHandler commandHandler = null;
		try {
			commandHandler = this.taskData.handler.newInstance();
		} catch (InstantiationException e) {
			e.printStackTrace();
			commandHandler = new InvalidHandler();
		} catch (IllegalAccessException e) {
			e.printStackTrace();
			commandHandler = new InvalidHandler();
		}
		
		ServerResponse serverResponse = commandHandler.handle(this.taskData.sessionData, this.taskData.clientMessage);
		serverResponse.receiveTime = start;
		serverResponse.reponseTime = System.currentTimeMillis();
		
		String response = gson.toJson(serverResponse);
		if(response.length() > 0){
			//this.webSocketServer.sendTextToClient(this.taskData.sessionId, response);
			
			//byte[] bytes = response.getBytes();
			
			/*
			Deflater compresser = new Deflater();
			compresser.setInput(bytes);
			compresser.finish();
			byte[] output = new byte[50];
			//int compressedDataLength = compresser.deflate(output);
		    //compresser.end();
		    */
			
			/*DeflaterInputStream dis = new DeflaterInputStream(fis);
			response.content = Base64.getEncoder().encodeToString(IOUtils.toByteArray(dis));
			dis.close();*/
			
			InputStream is = IOUtils.toInputStream(response, Charset.forName("UTF-8"));
			DeflaterInputStream dis = new DeflaterInputStream(is);
			byte[] data;
			try {
				data = IOUtils.toByteArray(dis);
				dis.close();
				LOG.log("Sending binary message with length " + data.length);
				this.webSocketServer.sendBinaryToClient(this.taskData.sessionId, data);
			} catch (IOException e) {
				e.printStackTrace();
			}
			
		}
	}
	
	public synchronized boolean isBusy() {
		return this.isBusy;
	}
	
	public synchronized boolean handleRequest(TaskData data) {
		if(this.isBusy)
			return false;
		
		this.isBusy = true;
		this.taskData = data;
				
		this.wait.release();
		
		return true;
	}
	
	public void kill() {
		this.keepAlive = false;
		this.wait.release();
	}
}
