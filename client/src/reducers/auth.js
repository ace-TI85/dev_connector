import {
  REGISTER_SUCCESS,
  REGISTER_FAIL 
} from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  itAuthenticated: null,
  loading: true,
  user: null
}

/**
 * @param state, action to perform
 * set local storage tokenq
 * @return new state
 */

function authReducer (state = initialState, action) {
  const { type, payload } = action;
  console.log(action);
  
  switch(type) {
    case REGISTER_SUCCESS:
      localStorage.setItem('token', payload.token);
      return { 
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false
       }
    case REGISTER_FAIL:
      localStorage.removeItem('token');
      return { 
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null
      } 
    default:
      return state;
  }
}

export default authReducer;