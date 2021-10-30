*Syntax client-side:
	-mode 1(control relay):setting/id_board/#
		{"mode":1,"setting":{"state":0}}
	-mode 2(timer):setting/id_board/#
		{"mode":2,"setting":{"number_alarm":1,alarm1":{"alarm_time":"07:00","state":1,"repeat":1,"weakday":1101101}}};
			|-weakday=(((((sun*10+mon)*10+tue)*10+wed)*10+thu)*10+fri)*10+sat;
			|-repeat:0-once,1-manytimes,2-outofdate
	-mode 3(handshake)setting/id_board/#
		{"mode":3,"handshake":1,"connected":1}
		{"mode":3,"handshake":1,"connected":2}
		|-connected:1 check device connection;2:get device info.
	-mode 4(update_webbrowser):setting/id_board/#
		{"mode":4,"update":1,"version":2.0}
*syntax server-side:
	-mode 1:turned_on/id_board/#
		{"mode":1,"sync":{"state":0}}	
	-mode 2(timer):turned_on/id_board/#
		{"mode":2,"sync":{"number_alarm":1,alarm1":{"alarm_time":"07:00","state":1,"repeat":1,"weakday":1101101}}};
			|-weakday=(((((sun*10+mon)*10+tue)*10+wed)*10+thu)*10+fri)*10+sat;
			|-repeat:0-once,1-manytimes,2-outofdate
	-mode 3(handshake)turned_on/id_board/#
		{"mode":3,"sync":{"number_alarm":1,alarm1":{"alarm_time":"07:00","state":1,"repeat":1,"weakday":1101101}}}
		|-connected:1 check device connection;2:get mode 2 device info.
	-mode 4(update_webbrowser):turned_on/id_board/#
		{"mode":4,"sync":1,"version":2.0}
*note:
	topic which client-side start making pre-handshake with all of device:check_connection/request;check_connection/response
		client side: check_connection/request
			{"pre_handshake":1}
		device-side: check_connection/response
			ID_board|devicename|groupname|relayname
			{"editInfo":0,"info":{"ID_board":1213312,"devicename":"nhan device","relay":[{"relayname":"desk lamp","groupname":""},{"relayname":"sssssssss","groupname":""},{"relayname":"","groupname":""}]}}