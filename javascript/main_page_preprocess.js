/***********************preprocessing**********************************************
 * connect server
 * get device onl, relay state,info of device(device name,group name,device mode).
***********************************************************************************/
let mqtt_variable={
    reconnecttimeout:2000,
    host:"broker.hivemq.com", 
    port:8000,
    clientID1:"clientId"+parseInt(Math.random() * 100, 10),
    topic:{
        clientside:{
            setting:{},
            requestinfo:"check_connection/request",
        },
        serverside:{
            turned_on:{},
            responseinfo:"check_connection/response",
        },
    },
    massage:{
        ON:'{"mode":1,"setting":{"state":1}}',
        OFF:'{"mode":1,"setting":{"state":0}}',
        hanshake:'{"pre_handshake":1}',
        modehandshake:'{"mode":3,"handshake":1,"connected":1}',
    },
    
};
let us={
    info:"info",
    ID_board:"ID_board",
    relaynumber:'relaynumber',
    devicename:'devicename',
    groupname:'groupname',
    relayname:'relayname',
    setting:'setting',
    turned_on:'turned_on',
    relay:'relay',
    subdevice:'device',
    editInfo:'editInfo',
    mode:'mode',
    sync:'sync',
    state:'state',
    OTA_href:'OTA_href',
    alarm:'alarm',
    alarm_time:'alarm_time',
    repeat:'repeat',
    weekday:'weekday',
    };

    let device=[];
    let determineTimer=-1;
    createInputButton.counter=0;
    onMessageArrived.counter=0;
    createDevicetabs.counter=0;
    createGrouptabs.counter=0;
////////////////////////////////// processing mqtt ///////////////////////////////////////////////
// Create a client instance
client = new Paho.MQTT.Client(mqtt_variable.host, Number(mqtt_variable.port), mqtt_variable.clientID1);
// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
// connect the client
client.connect({onSuccess:onConnect});

// called when the client connects
function onConnect() {
    
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    console.log(mqtt_variable.topic.serverside.responseinfo);
    client.subscribe(mqtt_variable.topic.serverside.responseinfo);
    console.log(mqtt_variable.topic.clientside.requestinfo);
    console.log(mqtt_variable.massage.hanshake);
    SendMessage(mqtt_variable.topic.clientside.requestinfo,mqtt_variable.massage.hanshake);

  }
  
  // called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:"+responseObject.errorMessage);
      client.connect({onSuccess:onConnect});
    }
  }

  function createTopic(sub1,sub2,sub3){
      let topic='';
      if(sub3){
        topic=sub1+'/'+sub2+'/'+sub3;
      }else{
        topic=sub1+'/'+sub2;
      }
      return topic;
  }

  function SendMessage(topic,msg){
      console.log(topic);
      console.log(msg);
    message = new Paho.MQTT.Message(msg);
    message.destinationName = topic;
    client.send(message);
}
// called when a message arrives
function onMessageArrived(message) {
    
    console.log("onMessageArrived:"+message.payloadString);
    let payloadStringtp=message.payloadString;
    switch(message.destinationName){
        case mqtt_variable.topic.serverside.responseinfo:
            if(isJson(payloadStringtp)){
                {
                    let obj=JSON.parse(payloadStringtp);
                    console.log( obj);
                    if(obj[us.info]){
                        let ID_board=obj[us.info][us.ID_board];
                        let checkthesameIDboard=false;
                        device.forEach((x,i)=>{
                            if(ID_board==x.deviceInfo[us.info][us.ID_board]) checkthesameIDboard=true;
                        });
                        if( !(checkthesameIDboard)){
                            counter=onMessageArrived.counter;
                            device[counter]={};
                            device[counter].deviceInfo=JSON.parse(payloadStringtp);
                            device[counter].relay=[];
                            device[counter].devicename=[];
                            console.log('ID_board');
                            console.log(ID_board);
                            //////device name
                            if(device[counter].deviceInfo[us.info][us.devicename]){
                                device[counter].devicename={};
                                createDevicetabs(device[counter].deviceInfo[us.info][us.devicename],counter,ID_board);
                            }else{
                                device[counter].devicename={};
                                createDevicetabs("device"+ID_board,counter,ID_board,1);
                            }
                            /////relay
                            device[counter].deviceInfo[us.info][us.relay].forEach((element,i) => {
                                device[counter].relay[i]={};
                                device[counter].relay[i].topic={};
                                device[counter].relay[i].topic.setting=createTopic(us.setting,ID_board,i+1);
                                device[counter].relay[i].topic.turned_on=createTopic(us.turned_on,ID_board,i+1);
                                client.subscribe(device[counter].relay[i].topic.turned_on);
                                console.log("device[counter].deviceInfo[us.info][us.relay][i][us.relayname]");
                                console.log(device[counter].deviceInfo[us.info][us.relay][i][us.relayname]);
                                let relayname_tp=element[us.relayname];
                                createInputButton(relayname_tp?relayname_tp:(us.relay+i+'_'+ID_board),counter,i,0);
                                i++;
                            }); 
                            
                            /////group name
                            let checksamegroup=false,checksamegroupIndex=-1;
                            let groupname=device[counter].deviceInfo[us.info][us.groupname];
                            device.forEach((x,i)=>{
                                if(i!=counter){
                                    if(groupname==x.deviceInfo[us.info][us.groupname]) checksamegroup=true;
                                    checksamegroupIndex=i;
                                }
                            })
                            if(device[counter].deviceInfo[us.info][us.groupname]){
                                if(!(checksamegroup)){
                                        console.log(device[counter].deviceInfo[us.info][us.groupname]);
                                        device[counter].groupname={};
                                        createGrouptabs(groupname,2,counter);
                                        console.log(device[counter].deviceInfo[us.info][us.groupname],2,ID_board);
                                    }else{
                                        device[counter].groupname={};
                                        device[counter].groupname.wrapElement={};
                                        device[counter].groupname.element={};
                                        device[counter].groupname.icon={};
                                        device[counter].groupname.wrapElement=device[checksamegroupIndex].groupname.wrapElement;
                                        device[counter].groupname.element=device[checksamegroupIndex].groupname.element;
                                        device[counter].groupname.icon=device[checksamegroupIndex].groupname.icon;
                                        
                                    }
                                }
                                ///////////send requested synchronization message
                                device[counter].deviceInfo[us.info][us.relay].forEach((element,i)=>{
                                    SendMessage(device[counter].relay[i].topic.setting,mqtt_variable.massage.modehandshake)
                                })
                            onMessageArrived.counter++;
                        }
                    }
                }
            }break;
        default:
            {
                if(message.destinationName.startsWith('turned_on')){
                    let ID_boardtp=message.destinationName.substr(message.destinationName.search('/')+1,message.destinationName.length);
                    let relayIndex=ID_boardtp.substr(ID_boardtp.search('/')+1,ID_boardtp.length)-1;
                    ID_boardtp=ID_boardtp.substr(0,ID_boardtp.search('/'));
                    if(isJson(payloadStringtp)){
                        let obj=JSON.parse(payloadStringtp);
                        let mode=obj[us.mode];
                        device.forEach((eachdevice,deviceIndex)=>{
                            if(eachdevice.deviceInfo[us.info][us.ID_board]==ID_boardtp){
                                switch(mode){
                                    case 1:{
                                        if(obj[us.sync][us.state]==1){
                                            eachdevice.relay[relayIndex].element.style.color="rgb(0, 221, 0)";
                                            eachdevice.relay[relayIndex].element.style.border='2px solid rgb(0, 221, 0)'; 
                                        }else{
                                            eachdevice.relay[relayIndex].element.style.color="#004400";
                                            eachdevice.relay[relayIndex].element.style.border='2px solid #aaaaaa'; 
                                        }
                                    }break;
                                    case 2:{

                                    }break;
                                    case 3:{
                                        eachdevice.relay[relayIndex].mode2={};
                                        eachdevice.relay[relayIndex].mode2=obj[us.sync];
                                        let numberOfTimer=obj[us.sync][us.alarm].length;
                                        device[deviceIndex].relay[relayIndex].timertag=[];
                                        for (let j=0;j<numberOfTimer;j++){
                                            createDisplayTimer(ID_boardtp,deviceIndex,relayIndex,obj[us.sync][us.alarm][j][us.alarm_time],obj[us.sync][us.alarm][j][us.state],obj[us.sync][us.alarm][j][us.repeat],obj[us.sync][us.alarm][j][us.weekday],j);
                                        }
                                    }break;
                                    case 4:{
                                        if(obj[us.sync]==1){
                                            let startButton=document.getElementsByClassName('OTA__control__access')[0];
                                            startButton.disabled=false;
                                            startButton.style.opacity=1;
                                            document.getElementsByClassName('OTA__control__access')[0].addEventListener('click',function(){
                                                const button = this;
                                                // console.log("test");
                                                const circle = document.createElement("span");
                                                const diameter = Math.max(button.clientWidth, button.clientHeight);
                                                const radius = diameter / 2;
                                            
                                                circle.style.width = circle.style.height = `${diameter}px`;
                                                circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
                                                circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
                                                circle.classList.add("ripple");
                                            
                                                const ripple = button.getElementsByClassName("ripple")[0];
                                            
                                                if (ripple) {
                                                ripple.remove();
                                                }
                                            
                                                button.appendChild(circle);

                                                let iframe=document.getElementsByClassName('OTA__iframe')[0];
                                                iframe.src=eachdevice.deviceInfo[us.info][us.OTA_href];
                                            });
                                        }
                                    }break;
                                }
                            }
                        });
                    }
                }
            }break;
        }
  }

  function isJson(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;
        console.log(item);
    try {
        item = JSON.parse(item);
    } catch (e) {
        console.log(false);
        return false;
    }
    if (typeof item === "object" && item !== null) {
        console.log(true);
        return true;
    }
    console.log(false);
    return false;
}

//////////////////////////// processing docmument///////////////////////////////////////////////// 
function createTabs(){
    const displayIframe=document.getElementById('content__displayFrame');
    let div1=document.createElement('div');
    div1.className="content__displayFrame--tabs";
    displayIframe.appendChild(div1);
    let div2=document.createElement('div');
    div2.className="content__displayFrame--tabs";
    div2.style.display="none";
    displayIframe.appendChild(div2);
    let div3=document.createElement('div');
    div3.className="content__displayFrame--tabs";
    displayIframe.appendChild(div3);
}
document.getElementsByClassName('content__displayFrame--control--all')[0].style.color='rgb(216, 19, 19)';
document.getElementsByClassName('content__displayFrame--control--edit')[0].style.color='rgb(216, 19, 19)';
const root=document.querySelector(":root");
document.getElementsByClassName('OTA__control__access')[0].disabled=true;
document.getElementsByClassName('OTA__control__access')[0].style.opacity=0.5;

// createTabs();
//////////////////////////////home///////////////////////////////////////////////////////
/////menu bars

document.getElementsByClassName('menubar__feature')[0].addEventListener('click',function home(){
    document.getElementsByClassName('content')[0].style.display='block';
    document.getElementsByClassName('timer')[0].style.display='none';
    document.getElementsByClassName('OTA')[0].style.display='none';
});

///////navigation
document.getElementsByClassName('content__navigation--group')[0].addEventListener('click',function all(){
    document.getElementsByClassName('content__displayFrame--tabs')[0].style.display='block';
    document.getElementsByClassName('content__navigation--group')[0].style.backgroundColor='rgb(205, 210, 255)';
    document.getElementsByClassName('content__displayFrame--tabs')[1].style.display='none';
    document.getElementsByClassName('content__navigation--group')[1].style.backgroundColor='rgba(0, 0, 0, 0.342)';
    document.getElementsByClassName('content__displayFrame--tabs')[2].style.display='none';
    document.getElementsByClassName('content__navigation--group')[2].style.backgroundColor='rgba(0, 0, 0, 0.342)';
    // document.getElementsByClassName('content__navigation--group')[1].removeEventListener("click",all);
   
    device.forEach((x,i)=>{
        x.relay.forEach((element,n)=>{
            element.wrapElement.style.display='flex';
        });
    });
    document.getElementsByClassName('content__displayFrame--control--all')[0].style.visibility='visible';
});

document.getElementsByClassName('content__navigation--group')[1].addEventListener('click',function device(){
    document.getElementsByClassName('content__displayFrame--tabs')[0].style.display='none';
    document.getElementsByClassName('content__navigation--group')[0].style.backgroundColor='rgba(0, 0, 0, 0.342)';
    document.getElementsByClassName('content__displayFrame--tabs')[1].style.display='block';
    document.getElementsByClassName('content__navigation--group')[1].style.backgroundColor='rgb(205, 210, 255)';
    document.getElementsByClassName('content__displayFrame--tabs')[2].style.display='none';
    document.getElementsByClassName('content__navigation--group')[2].style.backgroundColor='rgba(0, 0, 0, 0.342)';
    // document.getElementsByClassName('content__navigation--group')[1].removeEventListener("click",device);
    document.getElementsByClassName('content__displayFrame--control--all')[0].style.visibility='hidden';
});

document.getElementsByClassName('content__navigation--group')[2].addEventListener('click',function group(){
    document.getElementsByClassName('content__displayFrame--tabs')[0].style.display='none';
    document.getElementsByClassName('content__navigation--group')[0].style.backgroundColor='rgba(0, 0, 0, 0.342)';
    document.getElementsByClassName('content__displayFrame--tabs')[1].style.display='none';
    document.getElementsByClassName('content__navigation--group')[1].style.backgroundColor='rgba(0, 0, 0, 0.342)';
    document.getElementsByClassName('content__displayFrame--tabs')[2].style.display='block';
    document.getElementsByClassName('content__navigation--group')[2].style.backgroundColor='rgb(205, 210, 255)';
    // document.getElementsByClassName('content__navigation--group')[1].removeEventListener("click",group);
    // document.getElementsByClassName('content__displayFrame--control--all')[0].style.opacity='0';
    document.getElementsByClassName('content__displayFrame--control--all')[0].style.visibility='hidden';
});

document.getElementsByClassName('content__navigation--sorting')[0].addEventListener('click',function sorting(event){
    const button = this;
    // console.log("test");
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
  
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");
  
    const ripple = button.getElementsByClassName("ripple")[0];
  
    if (ripple) {
      ripple.remove();
    }
  
    button.appendChild(circle);
    let arrsorting=[];
    console.log("sorting://////////////////////////////////////////")
    if(document.getElementsByClassName('content__displayFrame--tabs')[0].style.display!=='none'){
        let i=0;
        device.forEach(x=>{
            x.relay.forEach((element,m)=>{
                arrsorting[i]=element;
                i++;
            });
        });
        
        arrsorting=arrsorting.sort(function(a,b){
            if (a.relayname.value<=b.relayname.value) return -1;
            else return 1;
        });
        arrsorting.forEach(element1=>{
            console.log(element1.relayname.value);
        });
        i=0;
        device.forEach(x=>{
            x.relay.forEach((element,m)=>{
                if(i==0)
                arrsorting[i].wrapElement.parentNode.insertBefore(arrsorting[i].wrapElement,element.wrapElement);
                else arrsorting[i-1].wrapElement.parentNode.insertBefore(arrsorting[i].wrapElement,arrsorting[i-1].wrapElement.nextSibling);
                console.log(element.relayname.value);
                i++;
            });
        });
    }else if(document.getElementsByClassName('content__displayFrame--tabs')[1].style.display!=='none'){
        device.forEach((element,m)=>{
            arrsorting[m]=element;
            // i=m;
        })
        arrsorting=arrsorting.sort(function(a,b){
            if (a.devicename.element.value <=b.devicename.element.value) return -1;
            else return 1;
        });
        arrsorting.forEach(element=>{
            console.log(element.devicename.element.value);
        });
        arrsorting.forEach((element,i)=>{
            if(i===0){   
                device[i].devicename.wrapElement.parentNode.insertBefore(element.devicename.wrapElement,device[i].devicename.wrapElement);
            }else {
                device[i].devicename.wrapElement.parentNode.insertBefore(arrsorting[i].devicename.wrapElement,arrsorting[i-1].devicename.wrapElement.nextSibling);
            }
        });
        
    }else if(document.getElementsByClassName('content__displayFrame--tabs')[2].style.display!=='none'){
        device.forEach((element,m)=>{
            arrsorting[m]=element;
            // i=m;
        })
        arrsorting=arrsorting.sort(function(a,b){
            if (a.groupname.element.value <=b.groupname.element.value) return -1;
            else return 1;
        });
        arrsorting.forEach(element=>{
            console.log(element.groupname.element.value);
        });
        arrsorting.forEach((element,i)=>{
            if(i===0){   
                device[i].groupname.wrapElement.parentNode.insertBefore(element.groupname.wrapElement,device[i].groupname.wrapElement);
            }else {
                device[i].groupname.wrapElement.parentNode.insertBefore(arrsorting[i].groupname.wrapElement,arrsorting[i-1].groupname.wrapElement.nextSibling);
            }
        });
    }
});
///////control button
document.getElementsByClassName('content__displayFrame--control--all')[0].addEventListener('click',function(){
    //rgb(216, 19, 19)
    console.log(document.getElementsByClassName('content__displayFrame--control--all')[0].style.color);
    if(document.getElementsByClassName('content__displayFrame--control--all')[0].style.color=='rgb(216, 19, 19)'){
        device.forEach(element=>{
            element.relay.forEach(element1=>{
                if(element1.wrapElement.style.display=="flex"){
                    // element1.element.style.color='#00dd00';
                    // element1.element.style.border='2px solid #00dd00';
                    SendMessage(element1.topic.setting,mqtt_variable.massage.ON);
                } 
            });
        });
        document.getElementsByClassName('content__displayFrame--control--all')[0].textContent="ON";
        document.getElementsByClassName('content__displayFrame--control--all')[0].style.color='green';
        document.getElementsByClassName('content__displayFrame--control--all')[0].style.border='2px solid green';
    }else{
        device.forEach(element=>{
            element.relay.forEach(element1=>{
                if(element1.wrapElement.style.display=="flex"){
                    // element1.element.style.color='#004400';
                    // element1.element.style.border='2px solid #aaaaaa';
                    SendMessage(element1.topic.setting,mqtt_variable.massage.OFF);
                } 
            });
        });
        document.getElementsByClassName('content__displayFrame--control--all')[0].textContent="OFF";
        document.getElementsByClassName('content__displayFrame--control--all')[0].style.color='rgb(216, 19, 19)';
        document.getElementsByClassName('content__displayFrame--control--all')[0].style.border='2px solid rgb(216, 19, 19)';
    }
    
});
/////edit button
document.getElementsByClassName('content__displayFrame--control--edit')[0].addEventListener('click',function(){
    // let massageJSON1=JSON.stringify(device[0].deviceInfo);
    //         console.log(massageJSON1);
    // console.log(document.getElementsByClassName('content__displayFrame--control--edit')[0].style.color);
    if(document.getElementsByClassName('content__displayFrame--control--edit')[0].style.color=='rgb(216, 19, 19)'){
        console.log('editbutton:');
        let editbutton=document.getElementsByClassName('content__displayFrame--control--edit')[0];
        editbutton.textContent='save';
        editbutton.style.color='green';
        editbutton.style.border='2px solid green';
        device.forEach(deviceloop=>{
            deviceloop.relay.forEach(relayloop=>{
                relayloop.relayname.disabled=false;
            });
            deviceloop.devicename.element.disabled=false;
            if(deviceloop.groupname) deviceloop.groupname.element.disabled=false;
        });
        root.style.setProperty("--psuedo-display",'none');
    }else{
    //////save edit and update for server
        let editbutton=document.getElementsByClassName('content__displayFrame--control--edit')[0];
        editbutton.textContent='edit';
        editbutton.style.color='rgb(216, 19, 19)';
        editbutton.style.border='2px solid rgb(216, 19, 19)';
        device.forEach(deviceloop=>{
            deviceloop.relay.forEach((relayloop,i)=>{
                relayloop.relayname.disabled=true;
                deviceloop.deviceInfo[us.info][us.relay][i][us.relayname]= relayloop.relayname.value;
            });
            deviceloop.devicename.element.disabled=true;
            deviceloop.deviceInfo[us.info][us.devicename]= deviceloop.devicename.element.value;
            if(deviceloop.groupname)deviceloop.groupname.element.disabled=true;
            if(deviceloop.groupname) deviceloop.deviceInfo[us.info][us.groupname]= deviceloop.groupname.element.value;
            //update info
            deviceloop.deviceInfo[us.editInfo]=1;
            let massageJSON=JSON.stringify(deviceloop.deviceInfo);
            console.log(massageJSON);
            SendMessage(deviceloop.relay[0].topic.setting,massageJSON);
        });
        root.style.setProperty("--psuedo-display",'block');
    }
});

var addRuleCSS = (function (style) {
    var sheet = document.head.appendChild(style).sheet;
    return function (selector, css) {
        var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
            return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
        }).join(";");
        sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
    };
})(document.createElement("style"));

function createInputButton(buttonName,counter,relaynumber,frametabs){
    let inputButton={
    checkstate:[],
    blockIDname:[],
    wrap:[],
    button:[],
    button_checkbox:[],
    button_checkboxchecked:[],
    button_checkbox_icon:[],
    button_checkbox_label:[],
    // wrap_namedevice
    namedevice:[],
    statedevice:[],
    };
    // device[counter].relay[relaynumber].element={};
    // device[counter].relay[relaynumber].wrapElement={};
    // device[counter].relay[relaynumber].relayname={};
    let i=createInputButton.counter;
    const createframe=document.getElementsByClassName('content__displayFrame--tabs');
    //////////greate div ~ wrap
    inputButton.blockIDname[i]={};
    inputButton.wrap[i]=document.createElement('div');
    // test[i]=inputButton.wrap[i];
    inputButton.wrap[i].id='wrap'+i;
    inputButton.wrap[i].style.display='flex';
    inputButton.wrap[i].style.position='relative';
    inputButton.wrap[i].style.width='80%';
    inputButton.wrap[i].style.marginLeft='10%';
    // inputButton.wrap[i].style.marginRight='10%';
    inputButton.wrap[i].style.justifyContent='space-between';
    inputButton.wrap[i].style.alignItems='center';
    createframe[frametabs].appendChild(inputButton.wrap[i]);
    inputButton.blockIDname[i].wrap=document.getElementById('wrap'+i);
    device[counter].relay[relaynumber].wrapElement=document.getElementById('wrap'+i);
    ///////create div ~button
    inputButton.button[i]=document.createElement('div');
    inputButton.button[i].id='button'+i;
    inputButton.button[i].style.width='35px';
    inputButton.button[i].style.height='35px';
    inputButton.button[i].style.position='relative';
    inputButton.button[i].style.margin='4px';
    inputButton.blockIDname[i].wrap.appendChild(inputButton.button[i]);
    inputButton.blockIDname[i].button=document.getElementById('button'+i);
    ///////create input~checkbox
    inputButton.button_checkbox[i]=document.createElement('input');
    inputButton.button_checkbox[i].id='button_checkbox'+i;
    inputButton.button_checkbox[i].type='checkbox';
    inputButton.button_checkbox[i].style.width='100%';
    inputButton.button_checkbox[i].style.height='100%';
    inputButton.button_checkbox[i].style.opacity='0';
    inputButton.button_checkbox[i].style.cursor='pointer';
    inputButton.blockIDname[i].button.appendChild(inputButton.button_checkbox[i]);
    /////////create input~label
    inputButton.button_checkbox_label[i]=document.createElement('label');
    inputButton.button_checkbox_label[i].id='button_checkbox_label'+i;
    inputButton.button_checkbox_label[i].for='button_checkbox'+i;
    inputButton.button_checkbox_label[i].style.position='absolute';
    inputButton.button_checkbox_label[i].style.width='100%';
    inputButton.button_checkbox_label[i].style.height='100%';
    inputButton.button_checkbox_label[i].style.top='0';
    inputButton.button_checkbox_label[i].style.left='0';
    inputButton.button_checkbox_label[i].style.border='2px solid #aaaaaa';
    inputButton.button_checkbox_label[i].style.backgroundColor='grey';
    inputButton.button_checkbox_label[i].style.cursor='pointer';
    inputButton.button_checkbox_label[i].style.color='#004400';
    inputButton.blockIDname[i].button.appendChild(inputButton.button_checkbox_label[i]);
    inputButton.blockIDname[i].button_checkbox_label=document.getElementById('button_checkbox_label'+i);
    device[counter].relay[relaynumber].element=inputButton.blockIDname[i].button_checkbox_label;
    ///////////create input~icon
    inputButton.button_checkbox_icon[i]=document.createElement('i');
    inputButton.button_checkbox_icon[i].id='button_checkbox_icon'+i;
    inputButton.button_checkbox_icon[i].className='fas fa-power-off';
    inputButton.button_checkbox_icon[i].style.position='absolute';
    inputButton.button_checkbox_icon[i].style.top='50%';
    inputButton.button_checkbox_icon[i].style.right='50%';
    inputButton.button_checkbox_icon[i].style.transform='translate(50%,-50%)';
    inputButton.button_checkbox_icon[i].style.fontSize='15px';
    inputButton.blockIDname[i].button_checkbox_label.appendChild(inputButton.button_checkbox_icon[i]);
    ////create wrap~button~name

    ////create button~name
    inputButton.namedevice[i]=document.createElement('input');
    inputButton.namedevice[i].type='text';
    inputButton.namedevice[i].id='namedevice'+i;
    inputButton.namedevice[i].className+=' noneOutline';
    inputButton.namedevice[i].style.width="40%";
    inputButton.namedevice[i].style.background="transparent";
    inputButton.namedevice[i].disabled=true;
    inputButton.namedevice[i].style.border="hidden";
    inputButton.namedevice[i].style.whiteSpace="nowrap";
    inputButton.namedevice[i].style.overflow="hidden";
    inputButton.namedevice[i].style.textOverflow="ellipsis";
    inputButton.namedevice[i].style.transition="all 2s linear";
    inputButton.namedevice[i].value=buttonName;
    inputButton.blockIDname[i].wrap.appendChild(inputButton.namedevice[i]);
    device[counter].relay[relaynumber].relayname=document.getElementById('namedevice'+i);
    addRuleCSS("#"+inputButton.namedevice[i].id+":before",{
        content:buttonName, 
        opacity:"0",
        transition: "1s all",
        position: 'absolute ',
        left: 'calc(40%)',
        'max-width':'70%',
        // 'word-break':'break-all',
        "overflow":'hidden',
        // "transition-delay":"2s",
        top: 'calc(50% + 10px)',
        'padding': '5px 10px',
        'border-radius': '10px',
        background: 'white',
        color: 'black',
        "font-size": '0.8em',
    });
    addRuleCSS("#"+inputButton.namedevice[i].id+":hover::before",{
        content:buttonName, 
        position: 'absolute ',
        left: 'calc(40%)',
        'max-width':'70%',
        // 'word-break':'break-all',
        "overflow":'hidden',
        opacity:'1',
        "transition-delay":"1s",
        top: 'calc(50% + 10px)',
        'padding': '5px 10px',
        'border-radius': '10px',
        background: 'white',
        color: 'black',
        "font-size": '0.8em',
    });
    device[counter].relay[relaynumber].relayname.addEventListener('click',function(){
        device[counter].relay[relaynumber].relayname.select();
        });
    /////////create button~state
    inputButton.statedevice[i]=document.createElement('div');
    inputButton.statedevice[i].id='statedevice'+i;
    inputButton.statedevice[i].style.width="10px";
    inputButton.statedevice[i].style.height="10px";
    inputButton.statedevice[i].style.borderRadius="10px";
    inputButton.statedevice[i].style.backgroundColor="#004400";
    inputButton.blockIDname[i].wrap.appendChild(inputButton.statedevice[i]);
    ////////setup for pressing button
    inputButton.checkstate[i]=0;
    inputButton.blockIDname[i].button.addEventListener('click',function(){
        if(device[counter].relay[relaynumber].element.style.color!="rgb(0, 221, 0)"){
            
            SendMessage(device[counter].relay[relaynumber].topic.setting,mqtt_variable.massage.ON);
        }else{
            SendMessage(device[counter].relay[relaynumber].topic.setting,mqtt_variable.massage.OFF);
        }
    });
    /////create option for select tag of relay_timer
    // device[counter].relay[relaynumber].timerSelect={};
    // let timerSelect=device[counter].relay[relaynumber].timerSelect;
    // timer__selected__device=document.getElementsByClassName('timer__selected__device')[0];
    // timerSelect=document.createElement('label');
    let timer__device__option=document.createElement('option');
    timer__device__option.value=relaynumber;
    timer__device__option.textContent=buttonName;
    device[counter].devicename.timerSelect.appendChild(timer__device__option);


    createInputButton.counter++;
}

function createDevicetabs(devicename,counter,ID_board,frametabs=1){
    let block={
        wrap:[],
        wrap__icon:[],
        wrap__input:[],
    }
    let OTA_setlecttag={};
    let i=createDevicetabs.counter;
    device[counter].devicename={};
    device[counter].devicename.wrapElement={};
    device[counter].devicename.element={};
    device[counter].devicename.icon={};
    // device[counter].devicename.ID_board=ID_board;
    console.log('devicename:');
    console.log(devicename);
    const createframe=document.getElementsByClassName('content__displayFrame--tabs');

    block.wrap[i]=document.createElement('div');
    block.wrap[i].style.width='80%';
    block.wrap[i].style.position='relative';
    block.wrap[i].style.backgroundColor='transparent';
    block.wrap[i].style.display='flex';
    // block.wrap[i].style.display='none';
    block.wrap[i].style.justifyContent='space-around';
    block.wrap[i].style.marginTop='10px';
    device[counter].devicename.wrapElement=createframe[frametabs].appendChild(block.wrap[i]);

    block.wrap__icon[i]=document.createElement('i');
    block.wrap__icon[i].className="fas fa-folder";
    block.wrap__icon[i].className+=" psuedoAfterclassify";
    device[counter].devicename.icon=device[counter].devicename.wrapElement.appendChild(block.wrap__icon[i]);
    device[counter].devicename.icon.addEventListener('click',function (){
        device.forEach((element,m)=>{
            if(element.deviceInfo[us.info][us.ID_board] !=ID_board){
                element.relay.forEach(elem=>{
                    elem.wrapElement.style.display='none';
                });
            }else{
                element.relay.forEach(elem=>{
                    elem.wrapElement.style.display='flex';
                });
            }
        });
        
        document.getElementsByClassName('content__displayFrame--control--all')[0].style.visibility='visible';
        document.getElementsByClassName('content__displayFrame--tabs')[0].style.display='block';
        document.getElementsByClassName('content__displayFrame--tabs')[1].style.display='none';
        document.getElementsByClassName('content__displayFrame--tabs')[2].style.display='none';
    });

    block.wrap__input[i]=document.createElement('input');
    block.wrap__input[i].type='text';
    block.wrap__input[i].id='devicenameinput'+i;
    block.wrap__input[i].className="noneOutline";
    // block.wrap__input[i].className=+ 'hiddenFocusOutline';
    block.wrap__input[i].value=devicename;
    block.wrap__input[i].disabled='true';
    block.wrap__input[i].style.color='black';
    block.wrap__input[i].style.border='none';
    block.wrap__input[i].style.backgroundColor='transparent';
    device[counter].devicename.element=device[counter].devicename.wrapElement.appendChild(block.wrap__input[i]);
    device[counter].devicename.element.addEventListener('click',function(){
        device[counter].devicename.element.select();
    }); 
    ////////create in OTA__select__device
    OTA_select=document.getElementsByClassName('OTA__select__device')[0];
    OTA_setlecttag=document.createElement('option');

    OTA_setlecttag.className='OTA__select__option';
    OTA_setlecttag.value=ID_board;
    OTA_setlecttag.textContent=devicename;
    OTA_select.appendChild(OTA_setlecttag);
    ////create option in timer_device_select
    let timer__select__switch=document.getElementsByClassName('timer__selected')[0].getElementsByClassName('timer__selected__Switch')[0];
    let timer__switch__option=document.createElement('option');
    timer__switch__option.value=ID_board;
    timer__switch__option.textContent=devicename;
    timer__select__switch.appendChild(timer__switch__option);

    let timer__selected__device=document.getElementsByClassName('timer__selected')[0].getElementsByClassName('timer__selected__device')[0];
    let timer__device__select=document.createElement('select');
    timer__device__select.classList.add('timer__selected__device__select');
    timer__device__select.style.display='none';
    device[counter].devicename.timerSelect={};
    device[counter].devicename.timerSelect=timer__selected__device.appendChild(timer__device__select);

    let timer__device__option=document.createElement('option');
    timer__device__option.value="";
    timer__device__option.textContent='--Please choose an device--';
    device[counter].devicename.timerSelect.appendChild(timer__device__option);

    createDevicetabs.counter++;
}

function createGrouptabs(groupname,frametabs=2,counter){
    block={
        wrap:[],
        wrap__icon:[],
        wrap__input:[],
    }
    console.log('groupname:');
    console.log(groupname);
    let i=createDevicetabs.counter;
    device[counter].groupname={};
    device[counter].groupname.wrapElement={};
    device[counter].groupname.element={};
    device[counter].groupname.icon={};
    // device[counter].groupname.ID_board=ID_board;
    const createframe=document.getElementsByClassName('content__displayFrame--tabs');

    block.wrap[i]=document.createElement('div');
    block.wrap[i].style.width='80%';
    block.wrap[i].style.backgroundColor='transparent';
    block.wrap[i].style.display='flex';
    // block.wrap[i].style.display='none';
    block.wrap[i].style.justifyContent='space-around';
    block.wrap[i].style.marginTop='10px';
    device[counter].groupname.wrapElement=createframe[frametabs].appendChild(block.wrap[i]);

    block.wrap__icon[i]=document.createElement('i');
    block.wrap__icon[i].className="fas fa-folder";
    block.wrap__icon[i].className+=" psuedoAfterclassify";
    device[counter].groupname.icon=device[counter].groupname.wrapElement.appendChild(block.wrap__icon[i]);
    device[counter].groupname.icon.addEventListener('click',function(){
        device.forEach(element=>{
            console.log(element.deviceInfo.info.groupname);
            if(element.deviceInfo.info.groupname==device[counter].groupname.element.value){
                element.relay.forEach(element1=>{
                    element1.wrapElement.style.display='flex';
                });
            }else{
                element.relay.forEach(element1=>{
                element1.wrapElement.style.display='none';
            });
            }
        });
        document.getElementsByClassName('content__displayFrame--control--all')[0].style.visibility='visible';
        document.getElementsByClassName('content__displayFrame--tabs')[0].style.display='block';
        document.getElementsByClassName('content__displayFrame--tabs')[1].style.display='none';
        document.getElementsByClassName('content__displayFrame--tabs')[2].style.display='none';
    });

    block.wrap__input[i]=document.createElement('input');
    block.wrap__input[i].type='text';
    block.wrap__input[i].id='groupnameinput'+i;
    block.wrap__input[i].className= 'hiddenFocusOutline';
    block.wrap__input[i].value=groupname;
    block.wrap__input[i].disabled='true';
    block.wrap__input[i].style.color='black';
    block.wrap__input[i].style.border='none';
    block.wrap__input[i].style.backgroundColor='transparent';
    device[counter].groupname.element=device[counter].groupname.wrapElement.appendChild(block.wrap__input[i]);
    device[counter].groupname.element.addEventListener('click',function(){
        device[counter].groupname.element.select();
    }); 

    createDevicetabs.counter++;
}
////////////////////////////////////timer////////////////////////////////////////////
document.getElementsByClassName('menubar__feature')[1].addEventListener('click',function home1(){
    document.getElementsByClassName('content')[0].style.display='none';
    document.getElementsByClassName('timer')[0].style.display='block';
    document.getElementsByClassName('OTA')[0].style.display='none';
});
////create button
const timer__create=document.getElementsByClassName('timer__create')[0];
timer__create.getElementsByClassName('timer__create__btn')[0].addEventListener('click',function timerCreateBtn(){
    timer__create.getElementsByClassName('timer__areaCreate')[0].style.display='block';
})
///////////timer switch select 
const timer__selected=document.getElementsByClassName('timer__selected')[0];
timer__selected.getElementsByClassName('timer__selected__Switch')[0].addEventListener('change',function(){
    let timer__selected__Switch=timer__selected.getElementsByClassName('timer__selected__Switch')[0];
    if(timer__selected__Switch.value!=""){
        timer__selected.getElementsByClassName('timer__selected__device__label')[0].style.color='black';
        console.log(timer__selected__Switch.value);
        device.forEach((eachdevice,i)=>{
            if(eachdevice.deviceInfo[us.info][us.ID_board]==timer__selected__Switch.value){
                eachdevice.devicename.timerSelect.style.display='inline-block';
            }else{
                eachdevice.devicename.timerSelect.style.display='none';
            }
        });
    }else{
        timer__selected.getElementsByClassName('timer__selected__device__label')[0].style.color='transparent';
        device.forEach((eachdevice,i)=>{
                eachdevice.devicename.timerSelect.style.display='none';
        });
    }
})
//timer create
const alarm__mode__weekday=timer__create.getElementsByClassName('alarm__mode__weekday');
const checkbox__inputs=timer__create.getElementsByClassName('alarm__mode__weekday__input');
const checkbox__label=timer__create.getElementsByClassName('alarm__mode__weekday__label');
console.log(checkbox__inputs.length)
let i=0;
for(let j=0;j<checkbox__inputs.length;j++){
        checkbox__inputs[j].addEventListener("change",function(){
            console.log(j);
            if(this.checked){
                console.log('checked');
                checkbox__label[j].classList.add("borderAnimation");
            }else{
                console.log('unchecked');
                checkbox__label[j].classList.remove("borderAnimation");
            }
        })
}

const alarm__mode__state=timer__create.getElementsByClassName('alarm__mode__state');
alarm__mode__state[0].addEventListener('click',function(event){
    if(alarm__mode__state[0].style.backgroundColor!="blanchedalmond"){
        alarm__mode__state[0].style.backgroundColor='blanchedalmond';
        alarm__mode__state[1].style.backgroundColor='transparent';
    }
}) 

alarm__mode__state[1].addEventListener('click',function(event){
    if(alarm__mode__state[1].style.backgroundColor!="blanchedalmond"){
        alarm__mode__state[1].style.backgroundColor='blanchedalmond';
        alarm__mode__state[0].style.backgroundColor='transparent';
    }
}) 
const alarm__mode__repeat=timer__create.getElementsByClassName('alarm__mode__repeat');
alarm__mode__repeat[0].addEventListener('click',function(event){
    if(alarm__mode__repeat[0].style.backgroundColor!="blanchedalmond"){
        alarm__mode__repeat[0].style.backgroundColor='blanchedalmond';
        alarm__mode__repeat[1].style.backgroundColor='transparent';
        alarm__mode__repeat[2].style.backgroundColor='transparent';
        alarm__mode__weekday[0].style.display='none';
    }
}) 
alarm__mode__repeat[1].addEventListener('click',function(event){
    if(alarm__mode__repeat[1].style.backgroundColor!="blanchedalmond"){
        alarm__mode__repeat[1].style.backgroundColor='blanchedalmond';
        alarm__mode__repeat[0].style.backgroundColor='transparent';
        alarm__mode__repeat[2].style.backgroundColor='transparent';
        alarm__mode__weekday[0].style.display='none';
    }
}) 
alarm__mode__repeat[2].addEventListener('click',function(event){
    if(alarm__mode__repeat[2].style.backgroundColor!="blanchedalmond"){
        alarm__mode__repeat[2].style.backgroundColor='blanchedalmond';
        alarm__mode__repeat[0].style.backgroundColor='transparent';
        alarm__mode__repeat[1].style.backgroundColor='transparent';
        alarm__mode__weekday[0].style.display='flex';
    }
})
////create display timer
createDisplayTimer.cuonter=0;
function createDisplayTimer(ID_board,Dcounter,Rcounter,time,state,repeat,weekday,timerIndex){
    let alarm={};
    let alarm__time__text={};
    let alarm__time__desc={};
    let span=[];
    let alarm__time__clickEvent={};//alarm__time--clickEvent
    let alarm__time__plusicon={};
    let alarm__time__minusicon={};
    let alarm__devision=[];
    let alarm__mode={};
    let alarm__mode__state=[];
    let alarm__mode__repeat=[];
    let alarm__mode__weekday={};
    let alarm__mode__weekday__input=[];
    let alarm__mode__weekday__label=[];
    let timer__display=document.getElementsByClassName('timer__display')[0];

    ///create element according to the needs of timertabs on document
    alarm=document.createElement('div');
    alarm.classList.add('alarm');
    device[Dcounter].relay[Rcounter].timertag[timerIndex]={};
    device[Dcounter].relay[Rcounter].timertag[timerIndex]=timer__display.appendChild(alarm);
    alarm=device[Dcounter].relay[Rcounter].timertag[timerIndex];


    alarm__time=document.createElement('div');
    alarm__time.classList.add('alarm__time');
    alarm__time=alarm.appendChild(alarm__time);

    alarm__time__text=document.createElement('input');
    alarm__time__text.type="time";
    alarm__time__text.value=time;
    alarm__time__text.classList.add('alarm__time__text');
    alarm__time__text=alarm__time.appendChild(alarm__time__text);

    alarm__time__desc=document.createElement('div');
    alarm__time__desc.classList.add('alarm__time__desc');
    alarm__time__desc=alarm__time.appendChild(alarm__time__desc);

    span[0]=document.createElement('span');
    if(state) span[0].textContent='ON';
    else span[0].textContent='OFF';
    span[0]=alarm__time__desc.appendChild(span[0]);
    
    span[1]=document.createElement('span');
    if(repeat==0) span[1].textContent='Once';
    else if(repeat==1) span[1].textContent='Daily';
    else span[1].textContent='Customize';
    span[1]=alarm__time__desc.appendChild(span[1]);

    alarm__time__clickEvent=document.createElement('div');
    alarm__time__clickEvent.classList.add('alarm__time--clickEvent');
    alarm__time__clickEvent=alarm__time.appendChild(alarm__time__clickEvent);

    alarm__time__plusicon=document.createElement('span');
    alarm__time__plusicon.classList.add('alarm__time__plusicon');
    alarm__time__plusicon=alarm__time.appendChild(alarm__time__plusicon);

    alarm__time__minusicon=document.createElement('span');
    alarm__time__minusicon.classList.add('alarm__time__minusicon');
    alarm__time__minusicon=alarm__time.appendChild(alarm__time__minusicon);

    alarm__devision[0]=document.createElement('p');
    alarm__devision[0].classList.add('alarm__devision');
    alarm__devision[0].textContent='state';
    alarm__devision[0]=alarm.appendChild(alarm__devision[0]);
     
    alarm__mode=document.createElement('div');
    alarm__mode.classList.add('alarm__mode');
    alarm__mode=alarm.appendChild(alarm__mode);

    alarm__mode__state[0]=document.createElement('span');
    alarm__mode__state[0].textContent='ON';
    alarm__mode__state[0].classList.add('alarm__mode__state');
    if(state==1) alarm__mode__state[0].style.backgroundColor='blanchedalmond';
    alarm__mode__state[0]=alarm__mode.appendChild(alarm__mode__state[0]);

    alarm__mode__state[1]=document.createElement('span');
    alarm__mode__state[1].textContent='OFF';
    alarm__mode__state[1].classList.add('alarm__mode__state');
    alarm__mode__state[1].classList.add('alarm__mode__state__adjust');
    if(state==0) alarm__mode__state[0].style.backgroundColor='blanchedalmond';
    alarm__mode__state[1]=alarm__mode.appendChild(alarm__mode__state[1]);

    alarm__devision[1]=document.createElement('p');
    alarm__devision[1].classList.add('alarm__devision');
    alarm__devision[1].textContent='Repeat';
    alarm__devision[1]=alarm__mode.appendChild(alarm__devision[1]);

    alarm__mode__repeat[0]=document.createElement('span');
    alarm__mode__repeat[0].textContent='Once';
    alarm__mode__repeat[0].classList.add('alarm__mode__repeat');
    if(repeat==0) alarm__mode__repeat[0].style.backgroundColor='blanchedalmond';
    alarm__mode__repeat[0]=alarm__mode.appendChild(alarm__mode__repeat[0]);

    alarm__mode__repeat[1]=document.createElement('span');
    alarm__mode__repeat[1].textContent='Daily';
    alarm__mode__repeat[1].classList.add('alarm__mode__repeat');
    if(repeat==1) alarm__mode__repeat[1].style.backgroundColor='blanchedalmond';
    alarm__mode__repeat[1]=alarm__mode.appendChild(alarm__mode__repeat[1]);

    alarm__mode__repeat[2]=document.createElement('span');
    alarm__mode__repeat[2].textContent='Customize';
    alarm__mode__repeat[2].classList.add('alarm__mode__repeat');
    if(repeat==2) alarm__mode__repeat[2 ].style.backgroundColor='blanchedalmond';
    alarm__mode__repeat[2]=alarm__mode.appendChild(alarm__mode__repeat[2]);

    alarm__mode__weekday=document.createElement('div');
    alarm__mode__weekday.classList.add('alarm__mode__weekday');
    alarm__mode__weekday=alarm__mode.appendChild(alarm__mode__weekday);

    let arrWeekday=['sun','mon','tue','wed','thu','fri','sat'];
    let weekdaytp;
    for(let i=0;i<7;i++){
        weekdaytp=(weekday.toString()).substring(i,i+1);
        console.log(weekdaytp);
        alarm__mode__weekday__input[i]=document.createElement('input');
        alarm__mode__weekday__input[i].classList.add('alarm__mode__weekday__input');
        alarm__mode__weekday__input[i].id='alarm__mode__weekday__input'+ID_board+(i);
        alarm__mode__weekday__input[i].type='checkbox';
        alarm__mode__weekday__input[i]=alarm__mode__weekday.appendChild(alarm__mode__weekday__input[i]);

        alarm__mode__weekday__label[i]=document.createElement('label');
        alarm__mode__weekday__label[i].classList.add('alarm__mode__weekday__label');
        alarm__mode__weekday__label[i].for=alarm__mode__weekday__input[i].id;
        alarm__mode__weekday__label[i].textContent=arrWeekday[i];
        if(repeat=2)
        {
            if(weekdaytp==1) alarm__mode__weekday__label[i].classList.add('borderAnimation');
        }
        alarm__mode__weekday__label[i]=alarm__mode__weekday.appendChild(alarm__mode__weekday__label[i]);

    }
    /////conform addEventListener
    device[Dcounter].relay[Rcounter].timertag[timerIndex].addEventListener('click',function(event){
        event.stopPropagation();
    })
    ///open or close(by minimize button) timertab
    device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__time--clickEvent')[0].addEventListener('click',function(event){
        let alarm=device[Dcounter].relay[Rcounter].timertag[timerIndex];
        let alarm__time=alarm.getElementsByClassName('alarm__time')[0];
        let alarm__time__minusicon=alarm__time.getElementsByClassName('alarm__time__minusicon')[0];
        let alarm__time__clickEvent=alarm__time.getElementsByClassName('alarm__time--clickEvent')[0];
        let alarm__time__text=alarm__time.getElementsByClassName('alarm__time__text');

        alarm__time__plusicon=alarm__time.getElementsByClassName('alarm__time__plusicon')[0];
        console.log('alarm__time');
        event.stopPropagation();
        // closeCurrentAlarm(alarm);
        if(alarm.getElementsByClassName('alarm__mode')[0].style.display!='block'){
            determineTimer=timerIndex;
            alarm__time__plusicon.classList.add('rotateAnimation');
            alarm__time.getElementsByClassName('alarm__time__desc')[0].style.display='none';
            alarm.getElementsByClassName('alarm__mode')[0].style.display='block';
            alarm.getElementsByClassName('alarm__devision')[0].style.display='block';
            alarm.getElementsByClassName('alarm__devision')[1].style.display='block';
            alarm__time__clickEvent.style.width="30%";
            alarm__time__text[0].select();
            alarm__time__plusicon.addEventListener('animationend',function(){
                alarm__time__plusicon.classList.remove('rotateAnimation');
                alarm__time__plusicon.style.display='none';
                alarm__time__minusicon.style.display='inline-block';
            })
        }else{
            alarm__time__clickEvent.style.width="100%";
            alarm__time__plusicon.style.display='inline-block';
            alarm__time__minusicon.style.display='none';
            alarm__time.getElementsByClassName('alarm__time__desc')[0].style.display='inline-block';
            alarm.getElementsByClassName('alarm__mode')[0].style.display='none';
            alarm.getElementsByClassName('alarm__devision')[0].style.display='none';
            alarm.getElementsByClassName('alarm__devision')[1].style.display='none';
        }
    })
    ///
    /////////////select mode
    device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__state')[0].addEventListener('click',function(event){
        let alarm__mode__state=device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__state');
        if(alarm__mode__state[0].style.backgroundColor!="blanchedalmond"){
            alarm__mode__state[0].style.backgroundColor='blanchedalmond';
            alarm__mode__state[1].style.backgroundColor='transparent';
        }
    }) ;

    device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__state')[1].addEventListener('click',function(event){
        let alarm__mode__state=device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__state');
        if(alarm__mode__state[1].style.backgroundColor!="blanchedalmond"){
            alarm__mode__state[1].style.backgroundColor='blanchedalmond';
            alarm__mode__state[0].style.backgroundColor='transparent';
        }
    }) ;

    device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__repeat')[0].addEventListener('click',function(event){
        let alarm__mode__repeat=device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__repeat');
        if(alarm__mode__repeat[0].style.backgroundColor!="blanchedalmond"){
            alarm__mode__repeat[0].style.backgroundColor='blanchedalmond';
            alarm__mode__repeat[1].style.backgroundColor='transparent';
            alarm__mode__repeat[2].style.backgroundColor='transparent';
            device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__weekday')[0].style.display='none';
        }
    });

    device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__repeat')[1].addEventListener('click',function(event){
        let alarm__mode__repeat =device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__repeat');
        if(alarm__mode__repeat[1].style.backgroundColor!="blanchedalmond"){
            alarm__mode__repeat[1].style.backgroundColor='blanchedalmond';
            alarm__mode__repeat[0].style.backgroundColor='transparent';
            alarm__mode__repeat[2].style.backgroundColor='transparent';
            device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__weekday')[0].style.display='none';
        }
    });

    device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__repeat')[2].addEventListener('click',function(event){
        let alarm__mode__repeat=device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__repeat');
        if(alarm__mode__repeat[2].style.backgroundColor!="blanchedalmond"){
            alarm__mode__repeat[2].style.backgroundColor='blanchedalmond';
            alarm__mode__repeat[0].style.backgroundColor='transparent';
            alarm__mode__repeat[1].style.backgroundColor='transparent';
            device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__weekday')[0].style.display='flex';
        }
    }) ;

    let lengthtp=device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__weekday__input');
    for(let j=0;j<lengthtp;j++){
        device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__weekday__input')[j].addEventListener("change",function(){
            let alarm__mode__weekday__label=device[Dcounter].relay[Rcounter].timertag[timerIndex].getElementsByClassName('alarm__mode__weekday__label');
            console.log('checked');
            if(this.checked){
                alarm__mode__weekday__label[j].classList.add("borderAnimation");
            }else{
                console.log('unchecked');
                alarm__mode__weekday__label[j].classList.remove("borderAnimation");
            }
        })
    }

    

    createDisplayTimer.counter++;
}

document.addEventListener("click", closeCurrentAlarm);
    function closeCurrentAlarm(element){
    // console.log('click notarget')
    let alarm__time,alarm__mode,arrno=[],alarm;
    alarm=document.getElementsByClassName('alarm');
    alarm__time=document.getElementsByClassName('alarm__time');
    alarm__mode=document.getElementsByClassName('alarm__mode');
    console.log(alarm__time.length);
    for(let i=0;i<alarm__time.length-1;i++){
        if(alarm[i]==element){
            arrno.push(i);
        }
    }
    for(let i=0;i<alarm__mode.length-1;i++){
        // console.log(arrno.indexOf(i))
        // console.log('click notarget1')
        if(arrno.indexOf(i)){
                
                alarm__mode[i].style.display='none';
                alarm__time[i].getElementsByClassName('alarm__time--clickEvent')[0].style.width="100%";
                alarm__time[i].getElementsByClassName('alarm__time__plusicon')[0].style.display='inline-block';
                alarm__time[i].getElementsByClassName('alarm__time__plusicon')[0].classList.remove('rotateAnimation');
                alarm__time[i].getElementsByClassName('alarm__time__minusicon')[0].style.display='none';
                alarm__time[i].getElementsByClassName('alarm__time__desc')[0].style.display='inline-block';
                alarm[i].getElementsByClassName('alarm__devision')[0].style.display='none';
                alarm[i].getElementsByClassName('alarm__devision')[1].style.display='none';
        }
    }
    if(determineTimer!=-1){
        let ID_board=document.getElementsByClassName('timer__selected__Switch')[0].value;
        device.forEach((eachdevice,i)=>{
            if(eachdevice.deviceInfo[us.info][us.ID_board]==ID_board){
                let relayIndex=eachdevice.devicename.timerSelect.value;
                
            }
        });
    }

    }

////////////////////////////////////////Update OTA//////////////////////////////////////////
document.getElementsByClassName('menubar__feature')[3].addEventListener('click',function home2(){
    document.getElementsByClassName('content')[0].style.display='none';
    document.getElementsByClassName('timer')[0].style.display='none';
    document.getElementsByClassName('OTA')[0].style.display='block';
});

document.getElementsByClassName('OTA__control__request')[0].addEventListener('click',function OTA_request(event){
    const button = this;
    console.log("test");
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
  
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");
  
    const ripple = button.getElementsByClassName("ripple")[0];
  
    if (ripple) {
      ripple.remove();
    }
  
    button.appendChild(circle);
    const OTA_setlecttag =document.getElementsByClassName('OTA__select__device')[0];
    let topic;
    if(OTA_setlecttag.value){
        topic=us.setting+'/'+OTA_setlecttag.value+'/'+1;
        SendMessage(topic,'{"mode":4,"update":1,"version":2.0}');
    }
});

document.getElementsByClassName('OTA__select__device')[0].addEventListener('change',function(){
    OTA_setlect=document.getElementsByClassName('OTA__select__device')[0];
    if(OTA_setlect.value==""){
        let OTA_startbutton=document.getElementsByClassName('OTA__control__access')[0];
        OTA_startbutton.disabled=true;
        OTA_startbutton.style.opacity=0.5;
    }else{
        device.forEach(eachdevice=>{
            if(eachdevice.deviceInfo[us.info][us.ID_board]==OTA_setlect.value){
                console.log('change');
                let iframe=document.getElementsByClassName('OTA__iframe')[0];
                console.log(eachdevice.deviceInfo[us.info][us.OTA_href]);
                console.log(iframe.src);
                if(eachdevice.deviceInfo[us.info][us.OTA_href]!=iframe.src){
                    let OTA_startbutton=document.getElementsByClassName('OTA__control__access')[0];
                    OTA_startbutton.disabled=true;
                    OTA_startbutton.style.opacity=0.5;
                }
            }
        })
    }
})







