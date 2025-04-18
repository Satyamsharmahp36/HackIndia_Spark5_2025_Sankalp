import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!loginData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!loginData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_BACKEND}/login`, {
          username: loginData.username,
          password: loginData.password
        });

        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('userPlan', response.data.plan);
        
        alert('Login Successful!');
      } catch (error) {
        alert(error.response?.data?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          Login to ChatMate
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="text"
              name="username"
              placeholder="Username"
              value={loginData.username}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg bg-gray-700/50 border ${
                errors.username ? 'border-red-500' : 'border-transparent'
              }`}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg bg-gray-700/50 border ${
                errors.password ? 'border-red-500' : 'border-transparent'
              }`}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-bold 
            hover:from-blue-600 hover:to-purple-600 
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging In...' : 'Login'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;