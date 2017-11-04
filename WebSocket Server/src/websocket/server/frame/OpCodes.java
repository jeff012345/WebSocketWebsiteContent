package websocket.server.frame;

public class OpCodes {

	public final static byte CONTINUATION = 0x0;
	public final static byte TEXT_FRAME = 0x1;
	public final static byte BINARY_FRAME = 0x2;
	public final static byte NON_CONTROL_0X3 = 0x3;
	public final static byte NON_CONTROL_0X4 = 0x4;
	public final static byte NON_CONTROL_0X5 = 0x5;
	public final static byte NON_CONTROL_0X6 = 0x6;
	public final static byte NON_CONTROL_0X7 = 0x7;
	public final static byte CONNECTION_CLOSE = 0x8;
	public final static byte PING = 0x9;
	public final static byte PONG = 0xA;
	public final static byte NON_CONTROL_0XB = 0xB;
	public final static byte NON_CONTROL_0XC = 0xC;
	public final static byte NON_CONTROL_0XD = 0xD;
	public final static byte NON_CONTROL_0XE = 0xE;
	public final static byte NON_CONTROL_0XF = 0xF;
	
	
}
