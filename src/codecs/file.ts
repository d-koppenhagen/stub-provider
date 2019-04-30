import { ICodec } from './codec.interface';

declare var window: any;

export class Codec implements ICodec {
  private _chunkLength = 10000;
  private _arrayToStoreChunks: string[] = [];

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

  send(input: { files: any[], from: string, to: string }, dataChannel: RTCDataChannel) {
    const that = this;
    console.log('[Codec file] send:', input, dataChannel);
    if (!dataChannel) { dataChannel = that.dataChannel; }

    const reader = new window.FileReader();
    let file: File;

    // iterate throught files
    for (let i = 0; i < input.files.length; i++) {
      file = input.files[i];
      reader.readAsDataURL(file);
      reader.onload = onReadAsDataURL;
    };

    function onReadAsDataURL(event: any, text: any) {
      if (event) { text = event.target.result; } // on first invocation

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

  /**
   * onDataMessage function
   * @param {String} dataMsg
   * @desc This is the function which will be registered on the DataChannel.onmessage-function
   * @desc This function needs to modify the incoming message and send it to this.onMessage afterwards
   */
  onDataMessage(dataMsg: any) {
    console.log('[Codec file] onData:', dataMsg);

    const data = JSON.parse(dataMsg.data);

    this._arrayToStoreChunks.push(data.message); // pushing chunks in array
    console.log('[Codec file] onData data:', data);

    if (data.last) {
      const filename = data.misc.name || 'unknownFileName';
      this._saveToDisk(this._arrayToStoreChunks.join(''), filename);
      this._arrayToStoreChunks = []; // resetting array
    }

  }

  private _saveToDisk(fileUrl: string, fileName: string) {
    const save = document.createElement('a');
    save.href = fileUrl;
    save.target = '_blank';
    save.download = fileName || fileUrl;

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);

    save.dispatchEvent(event);
    (window.URL || window.webkitURL).revokeObjectURL(save.href);
  }

}
