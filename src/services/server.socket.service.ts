import {Server as SocketServer} from 'socket.io';
import type {Server} from 'http';
import {SocketEvents} from '../../stub-manager/src/models/events';
import {FileService} from './file.service';

const {REQUEST_FILES, DISCONNECT, CONNECTION, USERS} = SocketEvents;

export class ServerSocketService {
  private static _instance: ServerSocketService;
  static instance() {
    return ServerSocketService._instance || new ServerSocketService();
  }
  private io?: SocketServer;
  private users = 0;
  private fileService = FileService.instance();

  constructor() {
    if (!ServerSocketService._instance) {
      ServerSocketService._instance = this;
    }
    return ServerSocketService._instance;
  }

  public async init(server: Server) {
    this.io = new SocketServer(server, {
      path: '/_editor/socket',
      transports: ['websocket'],
      cors: {
        origin: '*',
      },
    });
    const {io} = this;

    if (io) {
      io.on(CONNECTION, async (socket) => {
        this.users++;

        socket.on(DISCONNECT, () => {
          this.users--;
          io.emit(USERS, {users: this.users});
        });
        socket.on(REQUEST_FILES, async () => {
          const fileTree = await this.fileService.getFileTree();
          socket.emit(REQUEST_FILES, fileTree);
        });

        io.emit(USERS, {users: this.users});
      });
    }
  }
}
