export class Codec {
dataChannel: any = null;
onMessage: Function = null;

  constructor(dataChannel, onMessage) {
    this.dataChannel = dataChannel;
    this.onMessage = onMessage;
  }

  send(input: {}, dataChannel: any) {
    console.log('[Codec Chat] send:', input, dataChannel);
    if (dataChannel) dataChannel.send(JSON.stringify(input)); // when used as a geneal codec for many data channels
    else this.dataChannel.send(JSON.stringify(input)); // when instanciated only for a particular channel
  }

  onDataMessage(dataMsg: string) {
    console.log('[Codec Chat] onData:', dataMsg);
    this.onMessage(dataMsg); //
  }

}

