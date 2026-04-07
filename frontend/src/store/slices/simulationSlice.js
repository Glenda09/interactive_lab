import { createSlice } from '@reduxjs/toolkit';

const simulationSlice = createSlice({
  name: 'simulations',
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess(state, action) {
      state.loading = false;
      state.list = action.payload;
    },
    fetchOne(state, action) {
      state.loading = false;
      state.current = action.payload;
    },
    fetchError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    clearCurrent(state) {
      state.current = null;
    },
  },
});

export const { fetchStart, fetchSuccess, fetchOne, fetchError, clearCurrent } =
  simulationSlice.actions;
export default simulationSlice.reducer;
