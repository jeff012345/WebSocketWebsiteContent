package websocket.webserver;

import com.google.gson.JsonElement;

public class ServerResponse {

	public static enum Status {
		OK, ERROR
	}
	
	public Status status;
	public JsonElement data;
	public String error;
	public Long receiveTime;
	public Long reponseTime;
	
	public ServerResponse(Status status, JsonElement data){
		//TODO keep data as an object? does GSON get extended properties?
		this.status = status;
		this.data = data;
	}
	
	/*
	public ServerResponse(Status status, String data, boolean responds){
		this.status = status;
		this.data = data;
	}
	*/
	
	public static ServerResponse error(String message){
		ServerResponse r = new ServerResponse(Status.ERROR, null);
		r.error = message;
		return r;
	}
	
}
