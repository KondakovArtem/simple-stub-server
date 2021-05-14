import { useAppDispatch } from "../store/store";
import {io} from 'socket.io-client';
import { viewSlice } from "../store/view";


const URL = 'localhost:3001';

export class SocketService {
  static _instance: SocketService;
  static instance() {
    return SocketService._instance || new SocketService();
  }

  private dispatch: any;

  constructor() {
    if (!SocketService._instance) {
      SocketService._instance = this;
    }
    return SocketService._instance;
  }

  public init(dispatch: ReturnType<typeof useAppDispatch>) {
    this.dispatch = dispatch;
    const socket = io(URL, {
        path: '/_editor/socket',
        transports: ['websocket'],
      });
      socket.onAny((event, ...args) => {
        console.log(event, args);
      });
      socket.on('connect', () => {
        console.log('connect');
        this.dispatch(viewSlice.actions.setConnected(true));
      });
      socket.on('disconnect', () => {
        console.log('connect');
        this.dispatch(viewSlice.actions.setConnected(false));
      });
  }


}
