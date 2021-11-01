import React, { Fragment, useState } from 'react';
import axios from 'axios';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const { name, email, password, password2 } = formData;

  const onChange = e => setFormData({ 
                          ...formData, 
                          [e.target.name]: e.target.value,
                        });
  
  const onSubmit = async e => {
    e.preventDefault();

    if (password !== password2) {
      console.log('Passwords do not match.')
    } else {
      const newUser = {
        name: name,
        email: email,
        password: password,
      }

      try {
        const config = {
          headers: {
            "Content-Type": "application/json"
          }
        }

        const body = JSON.stringify(newUser);
        const response = await axios.post('/api/users', body, config);

        console.log(response.data);
      } catch (error) {
        console.log(error.response);
      }
    }
  }

  return (
    <Fragment>
      <h1 className="large text-primary">
        Sign Up
      </h1>
      <p className="lead"><i className="fas fa-user"></i>Create your account</p>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
        <input
          type="text"
          placeholder="Name"
          name="name"
          value={name}
          onChange = {e => onChange(e)}
        />
        </div>
        <div className="form-group">
          <input 
            type="email" 
            placeholder="Email Address" 
            name="email"
            value={email} 
            onChange = {e => onChange(e)}
            required 
          />
          <small className="form-text">This site uses Gravatar, so if you want profile image, use a Gravatar email</small>
        </div>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Password"
            name="password" 
            value={password} 
            onChange = {e => onChange(e)}
            minLength="6" 
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Confirm Password" 
            name="password2" 
            value={password2}
            onChange = {e => onChange(e)}
            minLength="6" 
          />
        </div>
        <input 
          type="submit" 
          value="Register" 
          className="btn btn-primary" 
        />
      </form>
      <p className="my-1">Already have an account? <a href="login.html">Sign In</a></p>
    </Fragment>
  )
}
