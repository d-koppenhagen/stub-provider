 'use strict';

 define(function(require, exports, module) {
   /**
    * @class
    * @desc For websocket connection to the NodeJS messaging Server
    */
   class SimpleStub {
     /**
      * @constructor
      */
     constructor() {
       /**
        * @type {String} ownRtcIdentity
        * @desc The own RTC Identity String
        */
       this.ownRtcIdentity;

       /**
        * @type {Object} credentials
        * @desc An object with additional credentials
        */
       this.credentials;

       /**
        * @type {Websocket} websocket
        * @desc To store the websocket connection to the messaging server
        */
       this.websocket;

       /**
        * @type {Array.<Conversations>} conversations
        * @desc To store the websocket connection to the messaging server
        */
       this.conversations = new Array();

       /**
        * @type {string} signalingServer
        * @desc The websocket connect url to the singalling server. This url is injected by require.js config from the WONDER-Framework
        */
       this.signalingServer = null;


       this.onMessage = null;

     }

     /**
      * SendMessage
      * @param message... Message
      */

     /**
      * @desc Send a new signalling Message from the WebRTC client to the messaging server
      * @param {Message} message - Contains a signalling message
      */
     sendMessage(message) {
       console.log('C->S: ', message);
       var full_message = new Object();
       full_message.type = 'message';
       full_message.body = message;


       // Multicast support for INVITE and UPDATE
       if ((message.type == MessageType.INVITATION || message.type == MessageType.UPDATE) && message.body.peers) {
         this.conversations.forEach(function(element, index, array) {
           if (element.contextId == message.conversationId)
             array.splice(index, 1);
         });
         var conversation = new Object();
         conversation.contextId = message.conversationId;
         conversation.peers = message.to;
         this.conversations.push(conversation);
       }

       // Multicast support if to is empty
       if (!message.to) {
         var peers;
         var that = this;
         this.conversations.forEach(function(element, index, array) {
           if (element.contextId == message.conversationId)
             peers = element.peers;
         });
         message.from = message.from.rtcIdentity;
         if (peers) {
           peers.forEach(function(element, index, array) {
             full_message.to = element;
             that.websocket.send(JSON.stringify(full_message));
           });
         }

         return
       }

       // From and To Identities are changed into strings containing rtcIdentities
       // If To is an array, it sends it to the first position
       message.from = message.from.rtcIdentity;
       if (message.to instanceof Array) {
         message.to.every(function(element, index, array) {
           array[index] = element.rtcIdentity;
         });
         full_message.to = message.to[0];
       } else {
         message.to = new Array(message.to.rtcIdentity);
         full_message.to = message.to[0];
       }
       full_message.contextId = message.conversationId;
       this.websocket.send(JSON.stringify(full_message));
     };

     /**
      * @desc Establishes a connection to the signalling server
      * @param {string} ownRtcIdentity - the own RTC identity string
      * @param {Object} credentials - Contains an object with additional credentials
      * @param {function} callbackFunction - Contains a callback function
      */
     connect(ownRtcIdentity, credentials, msgSrv, callbackFunction) {
       var that = this;
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

       var socket = this.websocket;
       this.websocket.onopen = function() {
         var message = new Object();
         message.type = 'login';
         message.from = ownRtcIdentity;
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

       this.websocket.onmessage = function(full_message) {
         var message = JSON.parse(full_message.data).body;
         console.log('S->C: ',message);
         that.onMessage(message); // give the message to the registered function to process it in wonder
       };
     }

     /**
      * @desc Disconnects an established connection from the signalling server
      */
     disconnect() {
       this.websocket.close();
       this.websocket = null;
       console.log('Websocket connection disconnected');
     };
   }

   /**
    * @returns {SimpleStub}an instance of MessagingStub_NodeJS
    */
   return new SimpleStub();
 });
