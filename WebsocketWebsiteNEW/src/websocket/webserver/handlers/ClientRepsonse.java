package websocket.webserver.handlers;

public abstract class ClientRepsonse extends MessageBase {

	public ClientRepsonse(MessageBase data){
		this.setRequestTime(data.getRequestTime());
		this.setCommand(data.getCommand());
		this.setRequestUUID(data.getRequestUUID());
	}
	
}
