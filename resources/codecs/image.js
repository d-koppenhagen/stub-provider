'use strict';

define(function (require, exports, module) {
  /**
   * @class
   * @desc A Codec for images which were send and transmitted to a recipient
   */
  class Codec {
    /**
     * @constructor
     */
    constructor(dataChannel, onMessage) {
      /**
       * @type {RtcDataChannel} dataChannel
       * @desc an datachannel where the codec should be established
       */
      this.dataChannel = dataChannel;

      /**
       * @type {function} onMessage
       * @desc The linked onmessage function for processing data result
       */
      this.onMessage = onMessage;

      /**
       * @type {Int} chunkLength
       * @desc The size of the data chunks in Bytes
       */
      this.chunkLength = 10000;

      /**
       * @type {Array.<String>} arrayToStoreChunks
       * @desc This array contains the data chunks
       */
      this.arrayToStoreChunks = [];

      /**
       * @type {function} checkFileSupport
       * @desc This function will check if the browser supports file handling
       */
      this.checkFileSupport();

      /**
       * @type {RegEx} dataType
       * @desc This contains an regular expression for fetching image files
       */
      this.dataType = /image.*/;
    }

    /**
     * This will check if FileReader API is available and if the Browser supports file sharing
     */
    checkFileSupport() {
      // Check for the various File API support.
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
      } else {
        alert('The File APIs are not fully supported in this browser.');
      }
    };

    /**
     * send function
     * @param {Object} input - The input data for this codec
     * @param {Object} dataChannel - A RtcDataChannel over which the data should be sended
     */
    send(input, dataChannel) {
      var that = this;
      console.log('[Codec image] send:', input, dataChannel);
      if (!dataChannel) dataChannel = that.dataChannel;

      var reader = new window.FileReader();
      var file;

      // iterate throught files
      for (var i = 0; i < input.images.length; i++) {
        file = input.images[i];
        reader.readAsDataURL(file);
        reader.onload = onReadAsDataURL;
      };

      function onReadAsDataURL(event, text) {
        var data = {}; // data object to transmit over data channel

        if (event) text = event.target.result; // on first invocation

        data.misc = { // include filename and other file information in last packet
          'name': file.name,
          'lastModifiedDate': file.lastModifiedDate,
          'size': file.size,
          'type': file.type,
          'from': input.from,
          'to': input.to
        }

        if (text.length > that.chunkLength) {
          data.message = text.slice(0, that.chunkLength); // getting chunk using predefined chunk length
        } else {
          data.message = text;
          data.last = true;
        }
        dataChannel.send(JSON.stringify(data)); // use JSON.stringify for chrome!

        var remainingDataURL = text.slice(data.message.length);
        if (remainingDataURL.length) setTimeout(function () {
          onReadAsDataURL(null, remainingDataURL); // continue transmitting
        }, 200)
      }

    }

    /**
     * onDataMessage function
     * @param {String} dataMsg
     * @desc This is the function which will be registered on the DataChannel.onmessage-function
     * @desc This function needs to modify the incoming message and send it to this.onMessage afterwards
     */
    onDataMessage(dataMsg) {
      var that = this;
      console.log('[Codec image] onData:', dataMsg);

      var data = JSON.parse(dataMsg.data);

      that.arrayToStoreChunks.push(data.message); // pushing chunks in array
      console.log('[Codec image] onData data:', data);

      if (data.last) {
        //var filename = data.misc.name || 'unknownFileName';
        var completeFile = that.arrayToStoreChunks.join('');
        var returnValue = {
          target: {
            payloadType: 'image'
          },
          type: 'message',
          data: completeFile
        }
        that.onMessage(returnValue);
        that.arrayToStoreChunks = []; // resetting array
      }

    }

  }

  /**
   * @return {Codec} an instance of the Codec
   */
  return new Codec();
});
