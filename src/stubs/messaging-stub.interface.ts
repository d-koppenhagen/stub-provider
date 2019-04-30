export interface IMessagingStub {
  sendMessage(message: any | Error): void;
  connect(
    ownRtcIdentity: string,
    credentials?: any,
    msgSrv?: string,
    callbackFunction?: () => void
  ): void;
  disconnect(): void;
  onMessage(msg: any): void;
}
