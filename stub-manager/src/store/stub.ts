import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface IFileTreeNode {
  title: string;
  key: string;
  type: 'file' | 'folder';
  children?: IFileTreeNode[];
}

interface StubState {
  files: IFileTreeNode[];
  pending: boolean;
}

const initialState: StubState = {
  files: [],
  pending: false,
};

export const stubSlice = createSlice({
  name: 'stub',
  initialState,
  reducers: {
    requestFiles(state) {
      state.pending = true;
    },
    fillFiles(state, action: PayloadAction<IFileTreeNode[]>) {
      state.pending = false;
      state.files = action.payload;
    },
  },
});
