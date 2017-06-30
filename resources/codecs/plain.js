'use strict';

define(function (require, exports, module) {
  /**
   * @class
   * @desc A Codec for plain text
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
    }

    /**
     * send function
     * @param {Object} input - The input data for this codec
     * @param {Object} dataChannel - A RtcDataChannel over which the data should be sended
     */
    send(input, dataChannel) {
      console.log('[Codec Plain] send:', input, dataChannel);
      if (dataChannel) dataChannel.send(input); // when used as a geneal codec for many data channels
      else this.dataChannel.send(JSON.stringify(input)); // when instanciated only for a particular channel
    }

    /**
     * onDataMessage function
     * @param {String} dataMsg
     * @desc This is the function which will be registered on the DataChannel.onmessage-function
     * @desc This function needs to modify the incoming message and send it to this.onMessage afterwards
     */
    onDataMessage(dataMsg) {
      console.log('[Codec Plain] onData:', dataMsg);
      this.onMessage(dataMsg);
    }

  }

  /**
   * @return {Codec} an instance of the Codec
   */
  return new Codec();
});
