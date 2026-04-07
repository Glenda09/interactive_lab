import api from './api';
import { loginStart, loginSuccess, loginFailure, logout } from '../store/slices/authSlice';

export const login = (email, password) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const { data } = await api.post('/auth/login', { email, password });
    dispatch(loginSuccess(data));
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.message || 'Error al iniciar sesión'));
  }
};

export const register = (name, email, password) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const { data } = await api.post('/auth/register', { name, email, password });
    dispatch(loginSuccess(data));
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.message || 'Error al registrarse'));
  }
};

export const logoutUser = () => (dispatch) => {
  dispatch(logout());
};
