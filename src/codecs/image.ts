import { ICodec } from './codec.interface';

declare var window: any;

export class Codec implements ICodec {
  private _chunkLength = 10000;
  private _arrayToStoreChunks: Blob[] = [];
  private _dataType = /image.*/;

  constructor(
    public dataChannel: RTCDataChannel,
    public onMessage: (msg: any) => void
  ) {
    this._checkFileSupport();
  }

  /**
   * This will check if FileReader API is available and if the Browser supports file sharing
   */
  private _checkFileSupport() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }
  }

  send(input: { images: any[], from: string, to: string }, dataChannel: RTCDataChannel) {
    const that = this;
    console.log('[Codec image] send:', input, dataChannel);
    if (!dataChannel) { dataChannel = this.dataChannel; }

    const reader = new window.FileReader();
    let file: File;

    // iterate throught files
    for (let i = 0; i < input.images.length; i++) {
      file = input.images[i];
      reader.readAsDataURL(file);
      reader.onload = onReadAsDataURL;
    }

    function onReadAsDataURL(event: any, text: any) {
      if (event) { text = event.result; } // on first invocation

      const data = {
        misc: {
          name: file.name,
          lastModifiedDate: file.lastModified,
          size: file.size,
          type: file.type,
          from: input.from,
          to: input.to
        },
        message: [],
        last: false
      }; // data object to transmit over data channel

      if (text.length > that._chunkLength) {
        data.message = text.slice(0, that._chunkLength); // getting chunk using predefined chunk length
      } else {
        data.message = text;
        data.last = true;
      }
      dataChannel.send(JSON.stringify(data)); // use JSON.stringify for chrome!

      const remainingDataURL = text.slice(data.message.length);
      if (remainingDataURL.length) {
        // setTimeout(onReadAsDataURL(null, remainingDataURL), 200); // continue transmitting
      }
    }
  }

  private readData(file: any, input: any) {

  }

  /**
   * onDataMessage function
   * @param {String} dataMsg
   * @desc This is the function which will be registered on the DataChannel.onmessage-function
   * @desc This function needs to modify the incoming message and send it to this.onMessage afterwards
   */
  onDataMessage(dataMsg: any) {
    console.log('[Codec image] onData:', dataMsg);

    const data = JSON.parse(dataMsg.data);

    this._arrayToStoreChunks.push(data.message); // pushing chunks in array
    console.log('[Codec image] onData data:', data);

    if (data.last) { // var filename = data.misc.name || 'unknownFileName';
      const completeFile = this._arrayToStoreChunks.join('');
      const returnValue = {
        target: {
          payloadType: 'image'
        },
        type: 'message',
        data: completeFile
      }
      this.onMessage(returnValue);
      this._arrayToStoreChunks = []; // resetting array
    }

  }

}
