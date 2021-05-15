import {useAppDispatch} from '../store/store';
import {io} from 'socket.io-client';
import {viewSlice} from '../store/view';
import {stubSlice} from '../store/stub';
import {SocketEvents} from '../models/events';

const {CONNECT, REQUEST_FILES, USERS, DISCONNECT} = SocketEvents;

const URL = 'localhost:3001';

export class SocketService {
  static _instance: SocketService;
  static instance() {
    return SocketService._instance || new SocketService();
  }

  private dispatch: any;
  private socket?: ReturnType<typeof io>;

  constructor() {
    if (!SocketService._instance) {
      SocketService._instance = this;
    }
    return SocketService._instance;
  }

  public async init(dispatch: ReturnType<typeof useAppDispatch>) {
    this.dispatch = dispatch;
    this.socket = io(URL, {
      path: '/_editor/socket',
      transports: ['websocket'],
    });
    this.socket.onAny((event, ...args) => {
      console.log(event, args);
    });
    this.socket.on(CONNECT, () => {
      console.log(CONNECT);
      this.dispatch(viewSlice.actions.setConnected(true));
    });
    this.socket.on(DISCONNECT, () => {
      console.log(DISCONNECT);
      this.dispatch(viewSlice.actions.setConnected(false));
    });
    this.socket.on(REQUEST_FILES, (data) => {
      this.dispatch(stubSlice.actions.fillFiles(data));
    });
  }

  public requestFiles() {
    this.dispatch(stubSlice.actions.requestFiles());
    this.socket?.emit(SocketEvents.REQUEST_FILES);
  }
}
