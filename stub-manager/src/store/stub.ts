import {createSlice, PayloadAction, createAsyncThunk} from '@reduxjs/toolkit';

interface IFile {
    fileName: string;
    children: IFile[];
}


interface StubState {
  files: IFile[],
  pending: boolean;
}

const initialState: StubState = {
    files: [],
    pending: false
};


export const stubSlice = createSlice({
  name: 'stub',
  initialState,
  reducers: {
    pending(state) {
        state.pending = true;
    },
    fill(state, action: PayloadAction<IFile[]>) {
      state.pending = false;
      state.files = action.payload;
    },
  },
});
