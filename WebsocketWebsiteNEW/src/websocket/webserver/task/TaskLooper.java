package websocket.webserver.task;

import java.util.Stack;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;

import websocket.server.connection.WebSocketServer;
import websocket.webserver.handlers.IClientMessageHandler;
import websocket.webserver.util.Logger;

public class TaskLooper implements Runnable {
	
	private LinkedBlockingQueue<TaskData> tasks;
	
	private boolean keepAlive = true;
	
	private boolean running = false;
	
	private static final Logger LOG = new Logger(TaskLooper.class.getName());
	
	private Stack<HandlerTask> taskPool;
	
	private WebSocketServer webSocketServer;
	
	public TaskLooper(WebSocketServer webSocketServer) {
		this.webSocketServer = webSocketServer;
		this.tasks = new LinkedBlockingQueue<TaskData>(100);
		this.taskPool = new Stack<>();
		
		for(int i = 0; i < 40; i++) {
			HandlerTask h = new HandlerTask(this.webSocketServer, this);
			(new Thread(h)).start();
			addStartedHandlerToStack(h);
		}
		
		LOG.log("Pool size = " + this.taskPool.size());
	}
	
	public void addTask(final long sessionId,
			ConcurrentHashMap<String, Object> sessionData,
			final Class<? extends IClientMessageHandler> handler, final String clientMessage) {
		try {
			tasks.put(new TaskData(sessionId, sessionData, handler, clientMessage));
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
	}
	
	@Override
	public void run() {
		LOG.log("The looper has started");
		this.running = true;
		
		TaskData task;
		while(keepAlive){
			task = null;
			try {
				LOG.log("Looper is waiting");
				long start = System.currentTimeMillis();
				task = tasks.take();
				long end = System.currentTimeMillis();
				LOG.log("wait time = " + (end - start));
				
				boolean tookTask = false;
				do {
					LOG.log("Find a thread");
					if(this.taskPool.isEmpty()) {
						LOG.log("Task Pool as empty. Creating new thread.");
						HandlerTask handler = new HandlerTask(this.webSocketServer, this);
						(new Thread(handler)).start();
						handler.handleRequest(task);
						tookTask = true;
					} else {
						tookTask = taskPool.pop().handleRequest(task);
						LOG.log("Popped - Pool size = " + this.taskPool.size());
					}
				} while(!tookTask);
				
				LOG.log("task was taken");
				
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}
 		}
		
		running = false;
		
		LOG.log("The looper has finished");
	}
	
	public boolean isRunning(){
		return running;
	}
	
	public void stopLooping(){
		keepAlive = false;
		tasks.clear();
	}
	
	public synchronized void addStartedHandlerToStack(HandlerTask handler) {
		this.taskPool.push(handler);
		LOG.log("Pushed - Pool size = " + this.taskPool.size());
	}
	
}
