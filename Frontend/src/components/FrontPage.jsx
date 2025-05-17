import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Bot, Sparkles, Globe2, Brain, Building2, Rocket, 
  Check, MessageSquare, Calendar, FileText, Users, 
  Zap, Coffee 
} from 'lucide-react';

import SignupPage from './SignupPage';
import LoginPage from './LoginPage';
import ContactUsPage from './ContactUsPage';
import HowItWorksPage from './HowItWorksPage';
import PromotionPopup from './PromotionPopup';
import OrganizationRegistrationPage from './OrganisationRegistration';

function FrontPage() {
  const [activeMascot, setActiveMascot] = useState('default');
  const [activeModal, setActiveModal] = useState(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [isProPromotion, setIsProPromotion] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND || '';
        const response = await fetch(`${backendUrl}/users/count`);
        const data = await response.json();
        
        if (data && data.count) {
          setTotalUsers(data.count);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    };

    fetchTotalUsers();
  }, []);

  const ParticleBackground = () => {
    const [particles, setParticles] = useState([]);
  
    useEffect(() => {
      const generateParticles = () => {
        const particleCount = 200; 
        const newParticles = Array.from({ length: particleCount }, () => ({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 4 + 1, 
          speed: Math.random() * 0.4 + 0.1,
          brightness: Math.random(), 
          color: Math.random() > 0.8 ? 'rgba(255,255,255,0.8)' : 'rgba(200,200,255,0.5)', 
          twinkleIntensity: Math.random() * 0.8 + 0.5 
        }));
        setParticles(newParticles);
      };
  
      generateParticles();
      window.addEventListener('resize', generateParticles);
      return () => window.removeEventListener('resize', generateParticles);
    }, []);
  
    return (
      <motion.div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {particles.map((particle, index) => (
          <motion.div
            key={index}
            initial={{ 
              x: particle.x, 
              y: particle.y,
              opacity: 0 
            }}
            animate={{ 
              x: particle.x + (Math.random() * 10 - 2), 
              y: particle.y + (Math.random() * 10 - 2),
              opacity: [
                particle.brightness, 
                particle.brightness * particle.twinkleIntensity, 
                particle.brightness
              ]
            }}
            transition={{
              duration: particle.speed * 6, 
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color}` 
            }}
          />
        ))}
      </motion.div>
    );
  };

  const TextGradient = ({ children, className = '' }) => {
    return (
      <motion.div
        initial={{ backgroundSize: '0% 100%' }}
        animate={{ backgroundSize: '100% 100%' }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className={`bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:0%_100%] ${className}`}
      >
        {children}
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const openModal = useCallback((modalType) => {
    console.log(`Opening modal: ${modalType}`);
    setActiveModal(modalType);
  }, []);

  const handleMascotClick = () => {
    window.open(`${import.meta.env.VITE_FRONTEND}`, '_blank');
  };
  
  const closeModal = useCallback(() => {
    console.log('Closing modal');
    setActiveModal(null);
  }, []);

  const showPromotionPopup = useCallback((isPro) => {
    setIsProPromotion(isPro);
    setShowPromotion(true);
  }, []);

  const handleGetStarted = useCallback(() => {
    setShowPromotion(false);
    openModal('signup');
  }, [openModal]);

  const handleRegisterOrg = useCallback(() => {
    openModal('organization');
  }, [openModal]);

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const modalComponents = {
    signup: <SignupPage />,
    login: <LoginPage />,
    contact: <ContactUsPage />,
    howitworks: <HowItWorksPage />,
    organization: <OrganizationRegistrationPage onBack={closeModal} onComplete={(data) => {
      console.log('Organization registration completed:', data);
      closeModal();
      // You could add additional logic here like showing a success message
    }} />
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden"
    >
      <ParticleBackground />

      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-white bg-red-500 rounded-full p-2 z-60"
              >
                Close
              </button>
              {modalComponents[activeModal]}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PromotionPopup 
        isOpen={showPromotion}
        onClose={() => setShowPromotion(false)}
        onSignup={handleGetStarted}
        isPro={isProPromotion}
        totalUsers={totalUsers}
        maxUsers={100}
      />

      <motion.div
        style={{ y: y1 }}
        className="fixed bottom-8 right-8 z-50 cursor-pointer group"
        variants={floatingVariants}
        animate="animate"
        whileHover={{ scale: 1.1 }}
      >
        <div className="flex flex-col items-center">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-semibold mb-2 text-blue-300 group-hover:text-blue-200 transition-colors"
          >
            ChatMate
          </motion.h3>
          <Bot 
            className={`w-16 h-16 ${
              activeMascot === 'default' ? 'text-blue-500' : 'text-purple-500'
            } transition-colors duration-300`}
              onClick={handleMascotClick}
          />
        </div>
        <AnimatePresence>
          {activeMascot === 'default' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-4 p-4 bg-white/10 backdrop-blur-lg rounded-lg w-24"
            >
              <p className="text-sm text-white">Click to start chat with AI👋</p>
            </motion.div>
          )}
        </AnimatePresence>
        
      </motion.div>

      <motion.div
        className="container mx-auto px-4 py-20 relative z-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="flex flex-col items-center text-center space-y-8"
          style={{ y: y2 }}
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center space-x-4"
          >
            <Bot className="w-20 h-20 text-blue-500 animate-pulse" />
            <TextGradient className="text-7xl font-extrabold">
              ChatMate
            </TextGradient>
          </motion.div>
          
          <motion.p
            variants={itemVariants}
            className="text-2xl text-gray-300 max-w-2xl"
          >
            Your Digital Twin for Smarter Work, Seamless Communication, and Intelligent Task Management
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4"
          >
            <motion.button
              onClick={() => openModal('howitworks')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
            >
              How It Works
            </motion.button>
            <motion.button
              onClick={() => openModal('contact')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border border-purple-500 rounded-full text-white font-bold hover:bg-purple-500/20 transition-all duration-300"
            >
              Contact Us
            </motion.button>
            <motion.button
              onClick={handleRegisterOrg}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full text-white font-bold hover:from-green-600 hover:to-teal-600 transition-all duration-300 flex items-center"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Register Organization
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Brain className="w-8 h-8 text-blue-500" />,
              title: "Personal Assistant",
              description: "Available 24/7 to handle your tasks, meetings, and reminders"
            },
            {
              icon: <Building2 className="w-8 h-8 text-purple-500" />,
              title: "Company Integration",
              description: "Track story points, manage projects, and maintain documentation"
            },
            {
              icon: <Globe2 className="w-8 h-8 text-green-500" />,
              title: "Multi-lingual Support",
              description: "Communicate effortlessly in multiple languages"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="container mx-auto px-4 py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.h2
          variants={itemVariants}
          className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
        >
          Transform Your Daily Workflow
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <MessageSquare className="w-12 h-12" />,
              title: "Smart Chat Support",
              description: "Provide 24/7 customer support with intelligent responses and seamless handoffs"
            },
            {
              icon: <Calendar className="w-12 h-12" />,
              title: "Schedule Management",
              description: "Let ChatMate handle your calendar, meetings, and reminders intelligently"
            },
            {
              icon: <FileText className="w-12 h-12" />,
              title: "Documentation Assistant",
              description: "Maintain and retrieve company documentation effortlessly"
            },
            {
              icon: <Users className="w-12 h-12" />,
              title: "Team Collaboration",
              description: "Facilitate team communication and project management across departments"
            },
            {
              icon: <Zap className="w-12 h-12" />,
              title: "Task Automation",
              description: "Automate repetitive tasks and workflows with intelligent processing"
            },
            {
              icon: <Coffee className="w-12 h-12" />,
              title: "Break Time Manager",
              description: "Smart notifications for breaks and work-life balance maintenance"
            }
          ].map((useCase, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm hover:from-blue-900/30 hover:to-purple-900/30 transition-all duration-500 overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
              />
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300 mb-4"
                >
                  {useCase.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {useCase.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="container mx-auto px-4 py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.h2
          variants={itemVariants}
          className="text-4xl font-bold text-center mb-16"
        >
          Choose Your Plan
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-gray-700"
            onClick={() => showPromotionPopup(false)}
          >
            <div className="flex flex-col h-full">
              <h3 className="text-2xl font-bold mb-4">Free Plan</h3>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Single deployed link with unique code access</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Basic admin section</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Community contributions</span>
                </li>
              </ul>
              <motion.button
                onClick={() => showPromotionPopup(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-lg border border-purple-700"
            onClick={() => showPromotionPopup(true)}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Pro Plan</h3>
                <span className="px-3 py-1 rounded-full bg-purple-500 text-sm font-semibold">Popular</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Personal deployed link</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Task scheduling</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>To-list Integration</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Chat history tracking</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Multi-language Support</span>
                </li>
              </ul>
              <motion.button
                onClick={() => showPromotionPopup(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-colors font-semibold"
              >
                Upgrade to Pro
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Organization Registration Section */}
      <motion.div
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-lg border border-blue-800/50 rounded-xl p-8 max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Building2 className="w-16 h-16 text-blue-400 mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Register Your Organization</h3>
              <p className="text-gray-300 mb-6">Set up your company workspace with ChatMate. Manage teams, departments, and leverage AI assistance across your organization.</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>Centralized organization management</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>Department-based access control</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>SSO integration options</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <motion.button
                onClick={handleRegisterOrg}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center shadow-lg shadow-blue-500/20"
              >
                <Building2 className="w-6 h-6 mr-2" />
                Register Your Organization
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="container mx-auto px-4 py-8 text-center text-gray-400"
      >
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span>Made with</span>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </motion.div>
          <span>by Satyam</span>
        </div>
        <div className="flex items-center justify-center">
          <motion.div
            animate={{
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Rocket className="w-4 h-4 mr-2" />
          </motion.div>
          <span>Powering the future of AI assistance</span>
        </div>
      </motion.footer>
    </div>
  );
}

export default FrontPage;