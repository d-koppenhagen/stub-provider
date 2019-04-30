import { ICodec } from './codec.interface';

export class Codec implements ICodec {
  constructor(
    public dataChannel: RTCDataChannel,
    public onMessage: (msg: any) => void
  ) { }

  send(input: {}, dataChannel: any) {
    console.log('[Codec Plain] send:', input, dataChannel);
    if (dataChannel) { // when used as a geneal codec for many data channels
      dataChannel.send(input);
    } else { // when instanciated only for a particular channel
      this.dataChannel.send(JSON.stringify(input));
    }
  }

  onDataMessage(dataMsg: string) {
    console.log('[Codec Chat] onData:', dataMsg);
    this.onMessage(dataMsg); //
  }

}

