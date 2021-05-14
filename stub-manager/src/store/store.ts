import {configureStore} from '@reduxjs/toolkit';
import {counterSlice} from './counter';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {logger} from 'redux-logger';
import {viewSlice} from './view';
import {stubSlice} from './stub';
// ...

export const store = configureStore({
  reducer: {
    [counterSlice.name]: counterSlice.reducer,
    [viewSlice.name]: viewSlice.reducer,
    [stubSlice.name]: stubSlice.reducer,
    // posts: postsReducer,
    // comments: commentsReducer,
    // users: usersReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
