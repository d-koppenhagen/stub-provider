export class MessagingStub {
  ownRtcIdentity: string;
  credentials: { any };
  websocket: any;
  conversations: any[] = [];
  signalingServer: string = null;
  onMessage: any = null;

  sendMessage(message: { type; from; to; conversationId, body }) {
    console.log('C->S: ', message);
    const fullMessage = {
      type: 'message',
      body: message,
      to: null,
      contextId: null
    }

    // Multicast support for INVITE and UPDATE
    if ((message.type === 'invitation' || message.type === 'update') && message.body.peers) {
      this.conversations.forEach((element, index, array) => {
        if (element.contextId === message.conversationId) { array.splice(index, 1); }
      });
      const conversation = {
        contextId: message.conversationId,
        peers: message.to
      }
      this.conversations.push(conversation);
    }

    // Multicast support if to is empty
    if (!message.to) {
      let peers;
      this.conversations.forEach((element, index, array) => {
        if (element.contextId === message.conversationId) { peers = element.peers; }
      });
      message.from = message.from.rtcIdentity;
      if (peers) {
        peers.forEach(function(element, index, array) {
          fullMessage.to = element;
          this.websocket.send(JSON.stringify(fullMessage));
        });
      }

      return
    }

    // From and To Identities are changed into strings containing rtcIdentities
    // If To is an array, it sends it to the first position
    message.from = message.from.rtcIdentity;
    if (message.to instanceof Array) {
      message.to.every((value: any, index: number, array: any[]) => {
        array[index] = value.rtcIdentity;
        return true;
      });
      fullMessage.to = message.to[0];
    } else {
      message.to = new Array(message.to.rtcIdentity);
      fullMessage.to = message.to[0];
    }
    fullMessage.contextId = message.conversationId;
    this.websocket.send(JSON.stringify(fullMessage));
  }

  connect(ownRtcIdentity: string, credentials: { any }, msgSrv: string, callbackFunction: Function) {
    this.ownRtcIdentity = ownRtcIdentity;
    this.credentials = credentials;
    this.signalingServer = msgSrv;

    // If connect was already executed succesfully, it won't try to connect again, just execute the callback.
    if (this.websocket) {
      console.log('Websocket connection already opened, executing callback function: ');
      callbackFunction();
      return;
    }

    console.log('Opening channel: ' + this.signalingServer);
    this.websocket = new WebSocket(this.signalingServer);

    const socket = this.websocket;
    this.websocket.onopen = function() {
      const message = {
        type: 'login',
        from: ownRtcIdentity
      }
      socket.send(JSON.stringify(message));
      console.log('Websocket connection opened and logging in as: ' + ownRtcIdentity + ' on: ' + msgSrv);
      callbackFunction();
    };

    this.websocket.onerror = function() {
      console.log('Websocket connection error');
    };

    this.websocket.onclose = function() {
      console.log('Websocket connection closed');
    };

    this.websocket.onmessage = function(fullMessage) {
      const message = JSON.parse(fullMessage.data).body;
      console.log('S->C: ', message);
      this.onMessage(message); // give the message to the registered function to process it in wonder
    };
  }

  disconnect() {
    this.websocket.close();
    this.websocket = null;
    console.log('Websocket connection disconnected');
  }
}
