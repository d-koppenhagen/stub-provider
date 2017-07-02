declare var window: any;

export class Codec {
  dataChannel: any = null;
  onMessage: Function = null;
  private _chunkLength = 10000;
  private _arrayToStoreChunks: string[] = [];

  constructor(dataChannel, onMessage) {
    this.dataChannel = dataChannel;
    this.onMessage = onMessage;
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
  };

  send(input: { files; from; to; }, dataChannel: any) {
    var that = this;
    console.log('[Codec file] send:', input, dataChannel);
    if (!dataChannel) dataChannel = that.dataChannel;

    var reader = new window.FileReader();
    var file;

    // iterate throught files
    for (var i = 0; i < input.files.length; i++) {
      file = input.files[i];
      reader.readAsDataURL(file);
      reader.onload = onReadAsDataURL;
    };

    function onReadAsDataURL(event, text) {
      var data = { misc: null, message: null, last: null }; // data object to transmit over data channel

      if (event) text = event.target.result; // on first invocation

      data.misc = { // include filename and other file information in last packet
        'name': file.name,
        'lastModifiedDate': file.lastModifiedDate,
        'size': file.size,
        'type': file.type,
        'from': input.from,
        'to': input.to
      }

      if (text.length > that._chunkLength) {
        data.message = text.slice(0, that._chunkLength); // getting chunk using predefined chunk length
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
  onDataMessage(dataMsg: { data }) {
    console.log('[Codec file] onData:', dataMsg);

    var data = JSON.parse(dataMsg.data);

    this._arrayToStoreChunks.push(data.message); // pushing chunks in array
    console.log('[Codec file] onData data:', data);

    if (data.last) {
      var filename = data.misc.name || 'unknownFileName';
      this._saveToDisk(this._arrayToStoreChunks.join(''), filename);
      this._arrayToStoreChunks = []; // resetting array
    }

  }

  private _saveToDisk(fileUrl: string, fileName: string) {
    var save = document.createElement('a');
    save.href = fileUrl;
    save.target = '_blank';
    save.download = fileName || fileUrl;

    var event = document.createEvent('Event');
    event.initEvent('click', true, true);

    save.dispatchEvent(event);
    (window.URL || window.webkitURL).revokeObjectURL(save.href);
  }

}
