// First, make sure to import lodash at the top of your file
import React, { useState } from "react";
import axios from "axios";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Building2,
  Users,
  Briefcase,
  CheckCircle,
  ChevronRight,
  User,
  Mail,
  Lock,
  Globe,
  Shield,
  Database,
} from "lucide-react";
import EnhancedReviewSection from "./Reviewsection";
// Add this import for debounce functionality
import debounce from 'lodash/debounce';

const OrganizationRegistrationPage = ({ onBack, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [formData, setFormData] = useState({
    orgName: "",
    industry: "",
    size: "",
    domain: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    adminConfirmPassword: "",
    ssoEnabled: false,
    ssoProvider: "",
    departments: [""],
  });

  const [errors, setErrors] = useState({});

  // Create a debounced function that persists between renders
  // Using useCallback with an empty dependency array ensures this function remains stable


  // Immediate UI update but debounced state changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    
    // Clear global error when any field is changed
    if (globalError) {
      setGlobalError(null);
    }
  };
  
  const addDepartment = () => {
    setFormData((prev) => ({
      ...prev,
      departments: [...prev.departments, ""],
    }));
  };

  const handleDepartmentChange = (index, value) => {
    const updatedDepartments = [...formData.departments];
    updatedDepartments[index] = value;
    setFormData((prev) => ({
      ...prev,
      departments: updatedDepartments,
    }));

    // Clear departments error when any department is changed
    if (errors.departments) {
      setErrors((prev) => ({ ...prev, departments: null }));
    }
  };

  const removeDepartment = (index) => {
    const updatedDepartments = formData.departments.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      departments: updatedDepartments,
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.orgName.trim())
        newErrors.orgName = "Organization name is required";
      if (!formData.industry) newErrors.industry = "Please select an industry";
      if (!formData.size) newErrors.size = "Please select company size";
      if (!formData.domain.trim()) newErrors.domain = "Domain is required";
      else if (
        !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(
          formData.domain
        )
      )
        newErrors.domain =
          "Please enter a valid domain format (e.g., company.com)";
    }

    if (currentStep === 2) {
      if (!formData.adminFirstName.trim())
        newErrors.adminFirstName = "First name is required";
      if (!formData.adminLastName.trim())
        newErrors.adminLastName = "Last name is required";
      if (!formData.adminEmail.trim())
        newErrors.adminEmail = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.adminEmail))
        newErrors.adminEmail = "Email is invalid";
      if (!formData.adminPassword)
        newErrors.adminPassword = "Password is required";
      else if (formData.adminPassword.length < 8)
        newErrors.adminPassword = "Password must be at least 8 characters";
      if (formData.adminConfirmPassword !== formData.adminPassword)
        newErrors.adminConfirmPassword = "Passwords do not match";
    }

    if (currentStep === 3) {
      // Optional SSO configuration
      if (formData.ssoEnabled && !formData.ssoProvider) {
        newErrors.ssoProvider = "Please select an SSO provider";
      }
    }

    if (currentStep === 4) {
      const emptyDepts =
        formData.departments.filter((dept) => !dept.trim()).length > 0;
      if (emptyDepts) newErrors.departments = "All departments must have names";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only process submission on step 5 (Review)
    if (step !== 5) {
      return;
    }

    // Validate entire form before submission
    let isValid = true;
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setStep(i); // Move to the first invalid step
        break;
      }
    }

    if (isValid) {
      setIsLoading(true);
      setGlobalError(null);

      try {
        // Prepare the payload based on your API requirements
        const payload = {
          orgName: formData.orgName,
          industry: formData.industry,
          size: formData.size,
          domain: formData.domain,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          ssoEnabled: formData.ssoEnabled,
          ssoProvider: formData.ssoProvider || null,
          departments: formData.departments.filter(
            (dept) => dept.trim() !== ""
          ),
        };

        // Make the API call to your backend
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND}/organizations/register`,
          payload
        );

        // Handle successful registration
        console.log("Registration successful:", response.data);

        // Store the token for authentication
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }

        // Call the onComplete function with the response data
        onComplete(response.data);
      } catch (error) {
        // Handle errors
        console.error("Registration error:", error);

        if (error.response && error.response.data) {
          // Display API validation errors
          const apiErrors = {};

          if (
            error.response.data.errors &&
            Array.isArray(error.response.data.errors)
          ) {
            error.response.data.errors.forEach((err) => {
              // Convert express-validator error format to our state format
              const fieldName = err.param;
              apiErrors[fieldName] = err.msg;
            });
            setErrors((prev) => ({ ...prev, ...apiErrors }));

            // Find which step has the first error and navigate to it
            const errorFields = Object.keys(apiErrors);
            if (errorFields.length > 0) {
              // Determine which step to navigate to based on the first error
              if (
                ["orgName", "industry", "size", "domain"].some((field) =>
                  errorFields.includes(field)
                )
              ) {
                setStep(1);
              } else if (
                [
                  "adminFirstName",
                  "adminLastName",
                  "adminEmail",
                  "adminPassword",
                  "adminConfirmPassword",
                ].some((field) => errorFields.includes(field))
              ) {
                setStep(2);
              } else if (
                ["ssoProvider"].some((field) => errorFields.includes(field))
              ) {
                setStep(3);
              } else if (
                ["departments"].some((field) => errorFields.includes(field))
              ) {
                setStep(4);
              }
            }
          } else if (error.response.data.msg) {
            // Handle single error message (e.g., "Organization with this domain already exists")
            setGlobalError(error.response.data.msg);
          }
        } else {
          // Handle network or unexpected errors
          setGlobalError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const industryOptions = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Retail",
    "Entertainment",
    "Other",
  ];

  const sizeOptions = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1000+",
  ];

  const ssoProviders = [
    "Google Workspace",
    "Microsoft Entra ID",
    "Okta",
    "OneLogin",
    "Custom SAML/OIDC",
  ];

  // Step titles and icons
  const steps = [
    { title: "Organization Details", icon: <Building2 className="w-6 h-6" /> },
    { title: "Admin Account", icon: <User className="w-6 h-6" /> },
    { title: "SSO Configuration", icon: <Shield className="w-6 h-6" /> },
    { title: "Departments", icon: <Briefcase className="w-6 h-6" /> },
    { title: "Review & Complete", icon: <CheckCircle className="w-6 h-6" /> },
  ];

  // Progress indicator
  const ProgressBar = React.memo(() => (
    <div className="mb-8 w-full">
      <div className="flex justify-between items-center mb-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center ${
              i < step
                ? "text-blue-500"
                : i === step - 1
                ? "text-purple-500"
                : "text-gray-500"
            }`}
          >
            <div
              className={`rounded-full w-12 h-12 flex items-center justify-center mb-2 ${
                i < step
                  ? "bg-blue-500 text-white"
                  : i === step - 1
                  ? "bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {i < step ? <CheckCircle className="w-6 h-6" /> : steps[i].icon}
            </div>
            <span className="text-xs text-center hidden md:block">
              {s.title}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-700 h-2 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  ));

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="flex items-center justify-between mb-6"
        variants={itemVariants}
      >
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Building2 className="w-8 h-8 text-purple-500 mr-2" />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Organization Registration
          </span>
        </h2>
        <div className="text-sm text-gray-400">
          Step {step} of {steps.length}
        </div>
      </motion.div>

      <ProgressBar />

      {globalError && (
        <div className="p-4 mb-6 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-red-400">{globalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Step 1: Organization Details */}
          {step === 1 && (
            <StepContainer key="step1" variants={containerVariants}>
              <motion.h3
                variants={itemVariants}
                className="text-xl font-semibold mb-6 text-blue-400"
              >
                Tell us about your organization
              </motion.h3>

              <InputField
                label="Organization Name"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                placeholder="Enter your organization's name"
                error={errors.orgName}
                icon={<Building2 className="w-5 h-5 text-gray-500" />}
                variants={itemVariants}
              />

              <SelectField
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                options={industryOptions}
                placeholder="Select your industry"
                error={errors.industry}
                variants={itemVariants}
              />

              <SelectField
                label="Company Size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                options={sizeOptions}
                placeholder="Select number of employees"
                error={errors.size}
                variants={itemVariants}
              />

              <InputField
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="yourcompany.com"
                error={errors.domain}
                icon={<Globe className="w-5 h-5 text-gray-500" />}
                helpText="Used for SSO integration and email verification"
                variants={itemVariants}
              />
            </StepContainer>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <StepContainer key="step2" variants={containerVariants}>
              <motion.h3
                variants={itemVariants}
                className="text-xl font-semibold mb-6 text-blue-400"
              >
                Create admin account
              </motion.h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="First Name"
                  name="adminFirstName"
                  value={formData.adminFirstName}
                  onChange={handleChange}
                  placeholder="First name"
                  error={errors.adminFirstName}
                  variants={itemVariants}
                />

                <InputField
                  label="Last Name"
                  name="adminLastName"
                  value={formData.adminLastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  error={errors.adminLastName}
                  variants={itemVariants}
                />
              </div>

              <InputField
                label="Email Address"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                placeholder="admin@yourcompany.com"
                error={errors.adminEmail}
                icon={<Mail className="w-5 h-5 text-gray-500" />}
                variants={itemVariants}
              />

              <InputField
                label="Password"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                placeholder="Create a secure password"
                type="password"
                error={errors.adminPassword}
                icon={<Lock className="w-5 h-5 text-gray-500" />}
                variants={itemVariants}
              />

              <InputField
                label="Confirm Password"
                name="adminConfirmPassword"
                value={formData.adminConfirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                type="password"
                error={errors.adminConfirmPassword}
                icon={<Lock className="w-5 h-5 text-gray-500" />}
                variants={itemVariants}
              />
            </StepContainer>
          )}

          {/* Step 3: SSO Configuration */}
          {step === 3 && (
            <StepContainer key="step3" variants={containerVariants}>
              <motion.h3
                variants={itemVariants}
                className="text-xl font-semibold mb-6 text-blue-400"
              >
                Configure Single Sign-On (Optional)
              </motion.h3>

              <motion.div variants={itemVariants} className="mb-6">
                <div className="flex items-center mb-4">
                  <input
                    id="ssoEnabled"
                    name="ssoEnabled"
                    type="checkbox"
                    checked={formData.ssoEnabled}
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="ssoEnabled" className="ml-2 text-gray-300">
                    Enable SSO for your organization
                  </label>
                </div>

                <p className="text-gray-400 text-sm">
                  Single Sign-On allows your employees to use their existing
                  company credentials
                </p>
              </motion.div>

              {/* Use a separate conditional rendering for SSO options */}
              {formData.ssoEnabled && (
                <>
                  <SelectField
                    label="SSO Provider"
                    name="ssoProvider"
                    value={formData.ssoProvider}
                    onChange={handleChange}
                    options={ssoProviders}
                    placeholder="Select your identity provider"
                    error={errors.ssoProvider}
                    variants={itemVariants}
                  />

                  <motion.div
                    variants={itemVariants}
                    className="mb-6 p-4 rounded-lg bg-blue-900/30 border border-blue-800"
                  >
                    <p className="text-sm text-blue-300 flex items-start">
                      <Shield className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        After registration, you'll be guided through the SSO
                        setup process specific to your selected provider.
                      </span>
                    </p>
                  </motion.div>
                </>
              )}
            </StepContainer>
          )}

          {/* Step 4: Departments */}
          {step === 4 && (
            <StepContainer key="step4" variants={containerVariants}>
              <motion.h3
                variants={itemVariants}
                className="text-xl font-semibold mb-6 text-blue-400"
              >
                Set up departments
              </motion.h3>

              <motion.div variants={itemVariants} className="mb-4">
                <p className="text-gray-300 mb-4">
                  Define departments to organize your team members and projects
                </p>

                {errors.departments && (
                  <p className="text-red-400 text-sm mb-2">
                    {errors.departments}
                  </p>
                )}

                {formData.departments.map((department, index) => (
                  <div key={index} className="flex items-center mb-3">
                    <div className="flex-grow relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) =>
                          handleDepartmentChange(index, e.target.value)
                        }
                        placeholder={`Department ${index + 1}`}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 pl-10 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {formData.departments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDepartment(index)}
                        className="ml-2 p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>

              <motion.button
                variants={itemVariants}
                type="button"
                onClick={addDepartment}
                className="flex items-center text-blue-400 hover:text-blue-300 mb-4"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add another department
              </motion.button>
            </StepContainer>
          )}

          {/* Step 5: Review & Complete */}
          {step === 5 && (
            <StepContainer key="step5" variants={containerVariants}>
              <motion.h3
                variants={itemVariants}
                className="text-xl font-semibold mb-6 text-blue-400"
              >
                Review your organization setup
              </motion.h3>

              {/* Enhanced Review Section */}
              <EnhancedReviewSection formData={formData} />

              <motion.div
                variants={itemVariants}
                className="p-4 rounded-lg bg-green-900/20 border border-green-800 mb-6"
              >
                <p className="text-green-300 flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    Once you complete registration, you'll be taken to your
                    organization dashboard where you can invite team members and
                    set up projects.
                  </span>
                </p>
              </motion.div>
            </StepContainer>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className="flex justify-between mt-8"
          variants={containerVariants}
        >
          <motion.button
            type="button"
            onClick={step === 1 ? onBack : prevStep}
            className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </motion.button>

          <motion.button
            type="submit"
            onClick={
              step < 5
                ? (e) => {
                    e.preventDefault();
                    nextStep();
                  }
                : undefined
            }
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </>
            ) : step === 5 ? (
              <>
                Complete Registration
                <CheckCircle className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
};

// Helper Components
const StepContainer = ({ children, variants }) => (
  <motion.div
    className="space-y-6"
    variants={variants}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  icon,
  helpText,
  variants,
}) => (
  <motion.div className="mb-4" variants={variants}>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-300 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-gray-800 border ${
          error ? "border-red-500" : "border-gray-700"
        } rounded-lg py-3 px-4 ${
          icon ? "pl-10" : ""
        } text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    {helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
  </motion.div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  variants,
}) => (
  <motion.div className="mb-4" variants={variants}>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-300 mb-1"
    >
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full bg-gray-800 border ${
        error ? "border-red-500" : "border-gray-700"
      } rounded-lg py-3 px-4 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </motion.div>
);

export default OrganizationRegistrationPage;
