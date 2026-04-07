import api from './api';
import {
  fetchStart,
  fetchSuccess,
  fetchOne,
  fetchError,
} from '../store/slices/simulationSlice';

export const fetchSimulations = (params) => async (dispatch) => {
  dispatch(fetchStart());
  try {
    const { data } = await api.get('/simulations', { params });
    dispatch(fetchSuccess(data));
  } catch (error) {
    dispatch(fetchError(error.response?.data?.message || 'Error al cargar simulaciones'));
  }
};

export const fetchSimulationById = (id) => async (dispatch) => {
  dispatch(fetchStart());
  try {
    const { data } = await api.get(`/simulations/${id}`);
    dispatch(fetchOne(data));
  } catch (error) {
    dispatch(fetchError(error.response?.data?.message || 'Error al cargar la simulación'));
  }
};
