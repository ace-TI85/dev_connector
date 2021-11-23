import api from '../utils/api';
import { setAlert } from './alert'
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR
} from './types';

/*
  NOTE: we don't need a config object for axios as the
 default headers in axios are already Content-Type: application/json
 also axios stringifies and parses JSON for you, so no need for 
 JSON.stringify or JSON.parse
*/

// Load User
export const loadUser = () => async (dispatch) => {
  try {
    const res = await api.get('/auth');

    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// Register user
export const register = (formData) => async dispatch => {
  console.log(formData);
  try {
    const res = await api.post('/users', formData);
    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });
    dispatch(loadUser());
   } catch (err) {
    const errors = err.response.data.errors;
    console.log(err.response);
    // show alert for each error
    if (errors) {
      errors.forEach(error => {
        dispatch(setAlert(error.msg, 'danger'))
        });
    }
    dispatch({
      type: REGISTER_FAIL,
    })
  }
}