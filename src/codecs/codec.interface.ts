export interface ICodec {
  send(input: any, dataChannel: RTCDataChannel): void;
  onDataMessage(dataMsg: any): void;
}
