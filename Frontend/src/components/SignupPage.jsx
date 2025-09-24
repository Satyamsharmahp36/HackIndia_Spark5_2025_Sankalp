import React, { useState, useCallback, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Eye, 
  EyeOff, 
  Info,
  CheckCircle,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Copy,
  MailCheck
} from 'lucide-react';

const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1f2937; /* gray-800 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4b5563; /* gray-600 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280; /* gray-500 */
  }
  
  * {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937; 
  }
`;

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNo: '',
    username: '',
    password: '',
    confirmPassword: '',
    geminiApiKey: ''
  });

  const [uiState, setUiState] = useState({
    showPassword: false,
    showGeminiKeyModal: false,
    showSuccessModal: false,
    showGooglePrompt: false,
    usePublicKey: false,
    activeField: null,
    loading: false,
    globalError: null,
    calendarStatusMessage:'',
    emailVerified: false,
    verificationInProgress: false
  });

  const [googleAuth, setGoogleAuth] = useState({
    accessToken: null,
    refreshToken: null,
    googleId: null,
    tokenExpiryDate: null
  });

  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  const inputVariants = {
    initial: { 
      opacity: 0, 
      x: -20,
      scale: 0.95 
    },
    animate: (index) => ({
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        type: 'spring',
        stiffness: 300
      }
    }),
    hover: {
      scale: 1.02,
      boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
    }
  };

  const backgroundVariants = {
    initial: { 
      backgroundPosition: '0% 50%',
      backgroundSize: '200% 200%'
    },
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%'],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  useEffect(() => {
    const handleEmailVerification = (event) => {

      const { success, userData, message } = event.data;
      
      setUiState(prev => ({
        ...prev,
        verificationInProgress: false
      }));

      if (success && userData) {
        setFormData(prev => ({
          ...prev,
          email: userData.email
        }));

        setGoogleAuth({
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          googleId: userData.googleId,
          tokenExpiryDate: userData.tokenExpiryDate
        });

        setUiState(prev => ({
          ...prev,
          emailVerified: true,
          globalError: null
        }));

        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.email;
          return newErrors;
        });
      } else {
        setUiState(prev => ({
          ...prev,
          globalError: message || "Email verification failed"
        }));
      }
    };

    window.addEventListener('message', handleEmailVerification);

    return () => {
      window.removeEventListener('message', handleEmailVerification);
    };
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const validationRules = {
      name: (value) => !value.trim() && "Name is required",
      email: (value) => {
        if (!uiState.emailVerified) return "Email verification required";
        return false;
      },
      mobileNo: (value) => {
        const mobileRegex = /^[0-9]{10}$/;
        return !value.trim() ? "Mobile number is required" : 
               !mobileRegex.test(value) ? "Invalid mobile number (10 digits)" : false;
      },
      username: (value) => {
        const usernameRegex = /^[^\s]+$/; 
        return !value.trim() ? "Username is required" : 
               value.length < 4 ? "Username must be at least 4 characters" :
               !usernameRegex.test(value) ? "Username cannot contain spaces" : false;
      },
      password: (value) => {
        return !value ? "Password is required" : 
               value.length < 8 ? "Password must be at least 8 characters" : false;
      },
      confirmPassword: (value) => {
        return value !== formData.password ? "Passwords do not match" : false;
      },
      geminiApiKey: (value) => {
        if (uiState.usePublicKey) return false;
        return !value.trim() && "Gemini API key is required";
      }
    };

    Object.keys(validationRules).forEach(field => {
      const errorMessage = validationRules[field](formData[field]);
      if (errorMessage) newErrors[field] = errorMessage;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, uiState.usePublicKey, uiState.emailVerified]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && uiState.emailVerified) {
      setUiState(prev => ({...prev, emailVerified: false}));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const verifyEmail = () => {
    setUiState(prev => ({...prev, verificationInProgress: true, globalError: null}));
    
    const popup = window.open(
      `${import.meta.env.VITE_BACKEND}/user/verify-email`,
      'GoogleEmailVerification',
      'width=500,height=600'
    );
      };

  const toggleUsePublicKey = () => {
    setUiState(prev => ({
      ...prev, 
      usePublicKey: !prev.usePublicKey,
      showGeminiKeyModal: false
    }));
    
    if (!uiState.usePublicKey) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.geminiApiKey;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setUiState(prev => ({...prev, globalError: null, loading: true}));

    if (!uiState.emailVerified) {
      setUiState(prev => ({
        ...prev, 
        globalError: "Please verify your email with Google first",
        loading: false
      }));
      return;
    }

    if (validateForm()) {
      try {
        const apiKeyToUse = uiState.usePublicKey 
          ? import.meta.env.VITE_GEMINI_KEY   
          : formData.geminiApiKey;

        const response = await axios.post(`${import.meta.env.VITE_BACKEND}/register`, {
          name: formData.name,
          email: formData.email,
          mobileNo: formData.mobileNo,
          username: formData.username,
          password: formData.password,
          geminiApiKey: apiKeyToUse,
          prompt:"",
          usePublicKey: uiState.usePublicKey,
          google: {
            id: googleAuth.googleId,
            accessToken: googleAuth.accessToken,
            refreshToken: googleAuth.refreshToken,
            tokenExpiryDate: googleAuth.tokenExpiryDate
          }
        });

        setUiState(prev => ({
          ...prev, 
          loading: false, 
          showSuccessModal: true,
          calendarStatusMessage: 'Google Sign-In & Calendar Access Successful! ✅'
        }));
      } catch (error) {
        setUiState(prev => ({
          ...prev, 
          globalError: error.response?.data?.message || 'Registration failed',
          loading: false
        }));
      }
    } else {
      setUiState(prev => ({...prev, loading: false}));
    }
  };

  const openGeminiKeyGuide = () => {
    window.open('https://aistudio.google.com/apikey', '_blank');
  };
  
  const handleRedirectToContent = () => {
    window.open(`${import.meta.env.VITE_FRONTEND}/home/${formData.username}`, '_blank');
  };

  const renderInputField = (field, index) => {
    const fieldConfig = {
      name: { label: "Full Name", type: "text" },
      email: { label: "Email Address", type: "email", special: "email-verify" },
      mobileNo: { label: "Mobile Number", type: "tel" },
      username: { label: "Unique Username", type: "text" },
      password: { label: "Password", type: uiState.showPassword ? "text" : "password" },
      confirmPassword: { label: "Confirm Password", type: uiState.showPassword ? "text" : "password" },
      geminiApiKey: { label: "Gemini API Key ", type: "text" }
    };

    if (field === 'geminiApiKey' && uiState.usePublicKey) {
      return null;
    }

    return (
      <motion.div
        key={field}
        custom={index}
        variants={inputVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        <div className="relative">
          <input 
            type={fieldConfig[field].type}
            name={field}
            placeholder={fieldConfig[field].label}
            value={formData[field]}
            onChange={handleChange}
            disabled={field === 'email' && uiState.emailVerified}
            onFocus={() => setUiState(prev => ({...prev, activeField: field}))}
            onBlur={() => setUiState(prev => ({...prev, activeField: null}))}
            className={`w-full p-3 rounded-lg 
              ${field === 'email' && uiState.emailVerified ? 'bg-green-100/30 border-green-500/50' : ''}
              ${uiState.activeField === field 
                ? 'ring-2 ring-purple-500/70 bg-gray-700/70' 
                : 'bg-gray-700/50'}
              ${errors[field] 
                ? 'border-2 border-red-500' 
                : field === 'email' && uiState.emailVerified 
                  ? 'border-2 border-green-500' 
                  : 'border-transparent'}
              transition-all duration-300 ease-in-out text-sm md:text-base`}
          />

          {field === 'email' && (
            <button 
              type="button"
              onClick={verifyEmail}
              disabled={uiState.emailVerified || uiState.verificationInProgress}
              className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded
                ${uiState.emailVerified 
                  ? 'bg-green-600/50 text-green-200 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}
                text-xs flex items-center transition-colors`}
            >
              {uiState.verificationInProgress ? (
                <span>Verifying...</span>
              ) : uiState.emailVerified ? (
                <>
                  <CheckCircle size={14} className="mr-1" />
                  <span>Verified</span>
                </>
              ) : (
                <>
                  <FcGoogle className="mr-1" />
                  <span>Verify</span>
                </>
              )}
            </button>
          )}

          {field === 'password' && (
            <button 
              type="button"
              onClick={() => setUiState(prev => ({...prev, showPassword: !prev.showPassword}))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {uiState.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          
          {field === 'geminiApiKey' && (
            <motion.button 
              type="button"
              onClick={() => setUiState(prev => ({...prev, showGeminiKeyModal: true}))}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 
                text-blue-200 hover:text-blue-300 
                animate-pulse hover:animate-none"
            >
              <Info size={18} />
            </motion.button>
          )}
        </div>
        {errors[field] && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs md:text-sm mt-1 pl-2 flex items-center"
          >
            <AlertTriangle size={14} className="mr-1" /> {errors[field]}
          </motion.p>
        )}

        {field === 'email' && !errors[field] && !uiState.emailVerified && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-blue-400 text-xs md:text-sm mt-1 pl-2 flex items-center"
          >
            <Info size={14} className="mr-1" /> Verification required for Google Calendar integration
          </motion.p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
      <style>{scrollbarStyles}</style>
      
      <motion.div 
        initial="initial"
        animate="animate"
        variants={backgroundVariants}
        className="w-full max-w-4xl h-auto max-h-[85vh] md:max-h-[90vh] overflow-auto rounded-xl 
          bg-gradient-to-br from-gray-900 via-black to-indigo-900 
          text-white p-4 relative shadow-2xl custom-scrollbar"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-lg mx-auto bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 md:p-6 
            shadow-xl border border-purple-500/20 relative"
        >
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute top-5 right-2 text-purple-400"
          >
            <Sparkles size={18} />
          </motion.div>

          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 bg-clip-text text-transparent 
            bg-gradient-to-r from-blue-500 to-purple-600 tracking-wider">
            Create Account
          </h2>

          {uiState.globalError && (
            <div className="bg-red-500/20 border border-red-500 p-2 rounded-lg mb-3 flex items-center">
              <AlertTriangle className="mr-2 text-red-500 flex-shrink-0" size={16} />
              <p className="text-red-300 text-xs md:text-sm">{uiState.globalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {['name', 'email', 'mobileNo', 'username', 'password', 'confirmPassword', 'geminiApiKey'].map(renderInputField)}

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-2 md:p-3 rounded-lg"
            >
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={uiState.usePublicKey}
                  onChange={toggleUsePublicKey}
                  className="sr-only"
                />
                <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors duration-300 ${uiState.usePublicKey ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <motion.div
                    animate={{ x: uiState.usePublicKey ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                </div>
                <span className="ml-2 text-xs md:text-sm font-medium">Use public Gemini API key</span>
              </label>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setUiState(prev => ({...prev, showGeminiKeyModal: true}))}
                className="ml-auto text-blue-300 hover:text-blue-200 transition-colors"
              >
                <Info size={16} />
              </motion.button>
            </motion.div>

            {uiState.usePublicKey && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-600/20 border border-yellow-600/50 p-2 md:p-3 rounded-lg text-xs md:text-sm"
              >
                <div className="flex items-start">
                  <AlertTriangle size={16} className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-400 mb-1">Using Public API Key: Limitations</p>
                    <ul className="space-y-1 text-yellow-200/80">
                      <li className="flex items-center">
                        <Clock size={12} className="mr-1.5" /> Slower response times
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={12} className="mr-1.5" /> May experience waiting queues
                      </li>
                      <li className="flex items-center">
                        <AlertTriangle size={12} className="mr-1.5" /> Limited usage during high traffic
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.97 }}
              disabled={uiState.loading}
              className="w-full p-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 
              font-bold text-sm md:text-base
              hover:from-blue-700 hover:to-purple-700 
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300 ease-in-out
              flex items-center justify-center space-x-2 mt-2"
            >
              {uiState.loading ? 'Processing...' : 'Create Account'}
              {!uiState.loading && <ArrowRight size={16} />}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {uiState.showGeminiKeyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-4 md:p-6 max-w-lg w-full max-h-[90vh] overflow-auto space-y-4 shadow-2xl border border-blue-500/30"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 #1f2937' }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                  Gemini API Key Guide
                </h3>
                <button 
                  onClick={() => setUiState(prev => ({...prev, showGeminiKeyModal: false}))}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-gray-300 text-sm md:text-base">
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-400 mb-1">
                    What is a Gemini API Key?
                  </h4>
                  <p>
                    A Gemini API Key is a unique authentication token that allows you to access Google's Gemini AI services. 
                    This key enables your application to interact with advanced AI capabilities.
                  </p>
                </div>

                {!uiState.usePublicKey ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700/50 p-3 rounded-lg">
                        <h4 className="text-base font-semibold text-green-400 mb-1">
                          Why You Need It
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Access advanced AI functionalities</li>
                          <li>Enable personalized AI interactions</li>
                          <li>Secure and authenticated API requests</li>
                        </ul>
                      </div>

                      <div className="bg-gray-700/50 p-3 rounded-lg">
                        <h4 className="text-base font-semibold text-purple-400 mb-1">
                          How to Obtain
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>Visit <a 
                            href="https://aistudio.google.com/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 underline hover:text-blue-300"
                          >
                            Google AI Studio
                          </a></li>
                          <li>Sign in with your Google account</li>
                          <li>Click "Create API Key"</li>
                          <li>Copy the generated key</li>
                        </ol>
                      </div>
                    </div>

                    <div className="bg-yellow-500/20 border border-yellow-500 p-3 rounded-lg flex items-start">
                      <Info className="mr-2 text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm">
                        <strong>Important:</strong> Keep your API key confidential. 
                        Do not share it publicly or commit it to version control.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <h4 className="text-lg font-semibold text-orange-400 mb-1">
                      Public API Key Option
                    </h4>
                    <p className="mb-2 text-sm">
                      We provide a shared public API key for users who want to try the platform without creating their own key.
                    </p>
                    
                    <div className="bg-red-500/20 border border-red-500 p-2 rounded-lg mb-2">
                      <h5 className="font-semibold text-red-400 mb-1 text-sm">Limitations:</h5>
                      <ul className="list-disc list-inside text-red-300 space-y-1 text-xs md:text-sm">
                        <li>Slower response times due to shared usage</li>
                        <li>Potential queuing during high traffic periods</li>
                        <li>Rate limiting may occur more frequently</li>
                        <li>Limited priority compared to users with personal keys</li>
                      </ul>
                    </div>
                    
                    <p className="text-blue-300 text-sm">
                      For the best experience, we recommend obtaining your own Gemini API key.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {!uiState.usePublicKey && (
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openGeminiKeyGuide}
                    className="px-4 py-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 
                    flex items-center space-x-1 font-semibold text-sm"
                  >
                    <span>Open AI Studio</span>
                    <ArrowRight size={16} />
                  </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleUsePublicKey}
                  className={`px-4 py-2 ${
                    uiState.usePublicKey 
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300' 
                      : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                  } rounded-lg font-semibold text-sm`}
                >
                  {uiState.usePublicKey ? 'Use My Own Key' : 'Use Public Key'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUiState(prev => ({...prev, showGeminiKeyModal: false}))}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 font-semibold text-sm"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uiState.showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-green-500/40 shadow-xl shadow-green-500/10"
            >
              <div className="text-center mb-4">
                <div className="inline-block p-3 bg-green-500/20 rounded-full mb-3">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
                  Registration Successful!
                </h3>
                <p className="text-gray-300 mt-2">Your account has been created successfully.</p>
              </div>

              <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <MailCheck size={16} className="text-green-400 mr-2" />
                  <h4 className="font-semibold text-green-400">Email Verification</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Your email has been verified with Google successfully.
                </p>
              </div>

              <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <CheckCircle size={16} className="text-blue-400 mr-2" />
                  <h4 className="font-semibold text-blue-400">Google Calendar Access</h4>
                </div>
                <p className="text-sm text-gray-300">
                  {uiState.calendarStatusMessage}
                </p>
              </div>

              <div className="flex justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRedirectToContent}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 
                    rounded-lg font-bold flex items-center"
                >
                  Continue to Dashboard
                  <ArrowRight size={18} className="ml-2" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignupPage;
