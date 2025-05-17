import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

// Enhanced Review Section Component
const EnhancedReviewSection = ({ formData }) => {
  const [expandedSections, setExpandedSections] = useState({
    orgDetails: true,
    adminAccount: false,
    ssoConfig: false,
    departments: false
  });

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ 
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 1, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Animation variants for sections
  const sectionVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="mb-6 bg-gray-800/50 rounded-lg p-6 border border-gray-700 max-h-96 overflow-y-auto"
      style={{ opacity, scale }}
    >
      {/* Organization Details Section */}
      <div className="mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("orgDetails")}
        >
          <h4 className="font-medium text-lg text-purple-400">
            Organization Details
          </h4>
          {expandedSections.orgDetails ? (
            <ChevronUp className="w-5 h-5 text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-400" />
          )}
        </div>
        
        <motion.div 
          initial={expandedSections.orgDetails ? "expanded" : "collapsed"}
          animate={expandedSections.orgDetails ? "expanded" : "collapsed"}
          variants={sectionVariants}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ReviewItem label="Organization Name" value={formData.orgName} />
            <ReviewItem label="Industry" value={formData.industry} />
            <ReviewItem label="Company Size" value={formData.size} />
            <ReviewItem label="Domain" value={formData.domain} />
          </div>
        </motion.div>
      </div>

      {/* Admin Account Section */}
      <div className="mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("adminAccount")}
        >
          <h4 className="font-medium text-lg text-purple-400">
            Admin Account
          </h4>
          {expandedSections.adminAccount ? (
            <ChevronUp className="w-5 h-5 text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-400" />
          )}
        </div>
        
        <motion.div 
          initial={expandedSections.adminAccount ? "expanded" : "collapsed"}
          animate={expandedSections.adminAccount ? "expanded" : "collapsed"}
          variants={sectionVariants}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ReviewItem
              label="Name"
              value={`${formData.adminFirstName} ${formData.adminLastName}`}
            />
            <ReviewItem label="Email" value={formData.adminEmail} />
          </div>
        </motion.div>
      </div>

      {/* SSO Configuration Section */}
      <div className="mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("ssoConfig")}
        >
          <h4 className="font-medium text-lg text-purple-400">
            SSO Configuration
          </h4>
          {expandedSections.ssoConfig ? (
            <ChevronUp className="w-5 h-5 text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-400" />
          )}
        </div>
        
        <motion.div 
          initial={expandedSections.ssoConfig ? "expanded" : "collapsed"}
          animate={expandedSections.ssoConfig ? "expanded" : "collapsed"}
          variants={sectionVariants}
          className="overflow-hidden"
        >
          <div className="mt-4">
            <ReviewItem
              label="SSO Status"
              value={formData.ssoEnabled ? "Enabled" : "Disabled"}
            />
            {formData.ssoEnabled && (
              <ReviewItem label="Provider" value={formData.ssoProvider} />
            )}
          </div>
        </motion.div>
      </div>

      {/* Departments Section */}
      <div className="mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("departments")}
        >
          <h4 className="font-medium text-lg text-purple-400">
            Departments
          </h4>
          {expandedSections.departments ? (
            <ChevronUp className="w-5 h-5 text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-400" />
          )}
        </div>
        
        <motion.div 
          initial={expandedSections.departments ? "expanded" : "collapsed"}
          animate={expandedSections.departments ? "expanded" : "collapsed"}
          variants={sectionVariants}
          className="overflow-hidden"
        >
          <div className="mt-4">
            {formData.departments.map((dept, i) => (
              <div key={i} className="flex items-center text-gray-300 mb-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                {dept || `Department ${i + 1}`}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center mt-2">
        <motion.div 
          className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ opacity: 0.5 }}
          animate={{ 
            opacity: [0.5, 1, 0.5], 
            y: [0, 3, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5 
          }}
        />
      </div>
    </motion.div>
  );
};

// Helper component from original code (kept for completeness)
const ReviewItem = ({ label, value }) => (
  <div className="mb-2">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-gray-200">{value || "Not specified"}</p>
  </div>
);

export default EnhancedReviewSection;