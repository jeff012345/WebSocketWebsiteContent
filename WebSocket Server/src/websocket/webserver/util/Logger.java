package websocket.webserver.util;

public class Logger {
	
	public static String FILTER_BY_CLASS_NAME = null;
	
	private String className;
	
	public Logger(String className){
		this.className = className;
	}
	
	public Logger(Class<?> clazz){
		this.className = clazz.getName();
	}
	
	public void log(String... message){
		if(FILTER_BY_CLASS_NAME != null && !FILTER_BY_CLASS_NAME.equals(className))
			return;
		
		String prefix = System.currentTimeMillis() + " - " + this.className + " : ";
		for(int i = 0; i < message.length; i++){
			System.out.println(prefix  + message[i]);
		}
	}
	
	public void logMethod(String methodName, String... message){
		String prefix = System.currentTimeMillis() + " - " + this.className + " - " + methodName + " : ";
		System.out.println(prefix  + message);
	}
	
}
