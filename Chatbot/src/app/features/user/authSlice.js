import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/* ─────────────  async thunk  ───────────── */
export const verifyVisitor = createAsyncThunk(
  'auth/verifyVisitor',
  async (username, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`
      );

      if (!res.ok) {
        let message = 'User not found';
        try {
          const errorData = await res.json();
          message = errorData.message || message;
        } catch {
          // If JSON parsing fails, use default message
        }
        return rejectWithValue(message);
      }
      const data = await res.json();
      return { username, data }; // Return both username and data
    } catch (err) {
      return rejectWithValue('Network error');
    }
  }
);

/* ─────────────  slice  ───────────── */
const initialState = {
  name: '',
  data: null,
  isAuth: false,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginGuest(state, action) {
      state.name = action.payload.name;
      state.data = action.payload.data;
      state.isAuth = true;
      state.status = 'succeeded';
      state.error = null;
    },
    logout: () => initialState,
    clearError(state) {
      state.error = null;
    },
    setUserData(state, action) {
      state.name = action.payload.username || action.payload.name;
      state.data = action.payload.data || action.payload;
      state.isAuth = true;
      state.status = 'succeeded';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyVisitor.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyVisitor.fulfilled, (state, action) => {
        state.name = action.payload.username;
        state.data = action.payload.data;
        state.isAuth = true;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(verifyVisitor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuth = false;
        state.name = '';
        state.data = null;
      });
  },
});

export const { loginGuest, logout, clearError, setUserData } = authSlice.actions;

/* selector for convenience */
export const selectAuth = (state) => state.auth;

export default authSlice.reducer;