import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface ITab {
  uid: string;
  name: string;
  tip: string;
}

interface ViewState {
  showDrawer: boolean;
  connected: boolean;
  tabs: ITab[];
  activeTab?: any;
}

const initialState: ViewState = {
  showDrawer: false,
  connected: false,
  tabs: [
    ...Array.from({length: 30}, (v, i) => {
      return {
        uid: i + '',
        name: `Tab${i}`,
        tip: `Description Tab${i}`,
      };
    }),
  ],
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
    setConnected(state, {payload}: PayloadAction<boolean>) {
      state.connected = payload;
    },
    setActiveTab(state, {payload}: PayloadAction<any>) {
      state.activeTab = payload;
    },
    closeTab(state, {payload}: PayloadAction<string>) {
      state.tabs = state.tabs.filter(({uid}) => uid !== payload);
    },
  },
});
