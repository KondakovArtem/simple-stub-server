import glob from 'glob';
import {promisify} from 'util';
import {relative, sep} from 'path';
import initial from 'lodash/initial';
import last from 'lodash/last';
import {lstatSync} from 'fs-extra';

const globPromise = promisify(glob);

interface IFileTreeNode {
  title: string;
  key: string;
  type: 'file' | 'folder';
  children?: IFileTreeNode[];
  isLeaf?: boolean;
}

export class FileService {
  private static _instance: FileService;
  private folder?: string;
  static instance() {
    return FileService._instance || new FileService();
  }
  constructor() {
    if (!FileService._instance) {
      FileService._instance = this;
    }
    return FileService._instance;
  }

  public init(folder: string) {
    this.folder = folder;
  }

  public async getFileTree() {
    const files = await globPromise(`${this.folder}/**/*`);

    const fileTree: IFileTreeNode = {
      title: 'root',
      key: '_',
      type: 'folder',
      children: [],
    };

    function getParentNode(path: string[]) {
      let curNode = fileTree;
      let curIdx = 0;
      const curKey = [];
      while (path.length > curIdx) {
        const pathItem = path[curIdx];
        curNode.children = curNode.children || [];
        const {children} = curNode;
        let item = children.find(({title}) => title === pathItem);
        if (!item) {
          curKey.push(pathItem);
          item = {
            title: pathItem,
            key: curKey.join('/'),
            type: 'folder',
            children: [],
          };
          children.push(item);
        }
        curNode = item;
        curIdx++;
      }
      return curNode;
    }

    for (const file of files) {
      const relPath = relative(this.folder as string, file);
      const pathData = relPath.split(sep);
      const parent = getParentNode(initial(pathData));
      const type = lstatSync(file).isDirectory() ? 'folder' : 'file';
      parent.children?.push({
        title: last(pathData) as string,
        key: relPath.replace(/\\/gi, '/'),
        type,
        isLeaf: type === 'folder' ? undefined : true,
        children: type === 'folder' ? [] : undefined,
      });
    }
    return fileTree.children;
  }
}
