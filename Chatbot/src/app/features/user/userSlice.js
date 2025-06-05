import { createSlice } from '@reduxjs/toolkit';

const initialState = { data: null, status: 'idle', error: null };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (s, a) => { s.data = a.payload; s.status = 'succeeded'; },
    clearUser:  (s)      => { Object.assign(s, initialState); },
  },
});

export const { setUserData, clearUser } = userSlice.actions;
export default userSlice.reducer;
