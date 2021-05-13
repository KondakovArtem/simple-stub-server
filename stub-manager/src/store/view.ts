import {createSlice} from '@reduxjs/toolkit';

interface ViewState {
  showDrawer: boolean;
}

const initialState: ViewState = {
  showDrawer: false,
};

export const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    toggleDrawer(state) {
      state.showDrawer = !state.showDrawer;
    },
    closeDrawer(state) {
      state.showDrawer = false;
    },
  },
});
