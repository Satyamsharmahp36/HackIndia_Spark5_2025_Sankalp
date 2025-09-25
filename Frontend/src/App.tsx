import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Switch from "./components/ui/switch";
import { AnimeNavBarDemo } from "./components/ui/anime-navbar-demo";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Features } from "./components/ui/features-6";
import { Send, Mic, Paperclip, MessageSquare, Settings, BarChart3, Calendar as CalendarIcon, Users, Brain, Slack, Mail, Plus, Sun, Moon, Gift } from 'lucide-react'
import FrontPage from "./components/FrontPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import HowItWorks from "./components/HowItWorks";
import Contact from "./components/Contact";
import PromotionPopup from "./components/PromotionPopup";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
      <style>
        {`
          .loader {
            width: 48px;
            height: 48px;
            border: 5px solid #3B82F6;
            border-bottom-color: transparent;
            border-radius: 50%;
            display: inline-block;
            box-sizing: border-box;
            animation: rotation 1s linear infinite;
          }
          @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Suspense>
  );
}

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className, fill }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const { x, y } = mousePosition;

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute z-[1] h-full w-full rounded-full ${className ?? ""}`}
      style={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, ${
          fill || "currentColor"
        }, transparent 80%)`,
      }}
    />
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <Card className="p-6 bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-all duration-300 group">
      <div
        className={`w-12 h-12 rounded-lg ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </Card>
  );
}

function ChatInterface() {
  const sidebarItems = [
    { icon: MessageSquare, label: 'Chat', active: true },
    { icon: Settings, label: 'Task Management' },
    { icon: BarChart3, label: 'Daily Workflow' },
    { icon: CalendarIcon, label: 'Calendar' },
    { icon: Users, label: 'Access Management' },
    { icon: BarChart3, label: 'Visitor Analytics' },
    { icon: Brain, label: 'Memory' },
    { icon: Slack, label: 'Slack' },
    { icon: Mail, label: 'Email' },
  ]

  const quickActions = [
    { icon: Plus, label: 'Create Self Task' },
    { icon: CalendarIcon, label: 'Schedule Meeting' },
  ]

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Try the ChatMate Interface
          </h2>
        </div>
        <div className="aspect-[16/10] bg-white dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800">
          <div className="flex h-full">
            <div className="w-72 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-indigo-500/20 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-indigo-700 font-semibold text-sm">Admin Panel</h1>
                    <p className="text-indigo-400 text-xs">ChatMATE</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4">
                <nav className="space-y-1">
                  {sidebarItems.map((item, index) => (
                    <div
                      key={index}
                      className={`${item.active ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'} flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </nav>

                <div className="mt-8">
                  <h3 className="text-gray-500 text-xs font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-1">
                    {quickActions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                      >
                        <action.icon className="w-4 h-4" />
                        <span>{action.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-black">
              <div className="p-4 border-b border-gray-200 dark:border-indigo-500/20 bg-gray-50/60 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-indigo=700 font-semibold">Swasti Mohanty's AI Assistant</h2>
                      <p className="text-indigo-400 text-xs">Powered by ChatMATE</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors">
                      Clear chat
                    </button>
                    <button className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors">
                      Contribute
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-white dark:bg-black">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-lg p-3 max-w-md">
                    <p className="text-gray-800 dark:text-white text-sm">I can set reminders, schedule meetings, and summarize important emails. What would you like to do?</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-indigo-600 rounded-lg p-3 max-w-md">
                    <p className="text-white text-sm">Set a reminder for tomorrow at 9 AM to review the Q3 report.</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">S</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-lg p-3 max-w-md">
                    <p className="text-gray-800 dark:text-white text-sm">Reminder set for tomorrow at 9:00 AM: Review the Q3 report. I’ll notify you 10 minutes earlier.</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-indigo-600 rounded-lg p-3 max-w-md">
                    <p className="text-white text-sm">Schedule a meeting with the marketing team on Friday at 3 PM.</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">S</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-lg p-3 max-w-md">
                    <p className="text-gray-800 dark:text-white text-sm">Drafted a calendar invite for Friday 3:00 PM with the marketing team. Also, your most important email today is from Priya about the budget approval — subject: “Final Approval Needed”. Want me to summarize it?</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-indigo-500/20 bg-gray-50/60 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Ask me anything about Swasti Mohanty..."
                      className="w-full bg-white dark:bg-black border border-gray-300 dark:border-indigo-500/30 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button className="text-gray-500 hover:text-indigo-400 transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-indigo-400 transition-colors">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { number: "24/7", label: "AI Availability" },
    { number: "<1s", label: "Response Time" },
    { number: "99.9%", label: "Uptime" },
    { number: "50+", label: "Integrations" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            {stat.number}
          </div>
          <div className="text-gray-400 text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function AIBotLandingPage() {
  const [showPromo, setShowPromo] = useState(false);
  const navigate = useNavigate();

  // Show promotion popup after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePromoClose = () => {
    setShowPromo(false);
  };

  const handlePromoSignUp = () => {
    setShowPromo(false);
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div id="hero" />
      <AnimeNavBarDemo />
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/60 backdrop-blur">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold text-gray-900 dark:text-white">ChatMate</Link>
            <nav className="flex items-center gap-4">
              <Link to="/how-it-works" className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">How it works</Link>
              <Link to="/contact" className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">Contact</Link>
              <Button 
                variant="outline"
                className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white flex items-center gap-1 border-gray-300 dark:border-gray-600"
                onClick={() => setShowPromo(true)}
              >
                <Gift className="w-4 h-4" />
                <span>Promotions</span>
              </Button>
              <Link to="/login" className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">Log in</Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">Sign up</Button>
              </Link>
              <ThemeToggleInline />
            </nav>
          </div>
        </div>
      </div>
      
      {showPromo && <PromotionPopup onClose={handlePromoClose} />}
      <section className="relative overflow-hidden pt-20">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="rgba(59, 130, 246, 0.15)"
        />
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-7xl md:text-8xl font-extrabold leading-tight text-gray-900 dark:text-white">
                  Chat
                  <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Mate</span>
                </h1>
                <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Meet your intelligent companion that answers questions,
                  schedules meetings, manages emails, and sets reminders - all
                  through natural conversation.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-10 py-4 text-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="px-10 py-4 text-lg">
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-[600px] lg:h-[700px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full relative z-10"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Chat Interface directly below hero */}
      <ChatInterface />

      <section className="py-20 border-y border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <StatsSection />
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need in{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                One AI
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Streamline your workflow with our intelligent assistant that
              handles all your daily tasks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="💬"
              title="Smart Q&A"
              description="Get instant, accurate answers to any question with our advanced AI that understands context and provides detailed responses."
              gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon="📅"
              title="Meeting Scheduler"
              description="Effortlessly schedule, reschedule, and manage meetings across multiple calendars with intelligent conflict detection."
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon="📧"
              title="Email Management"
              description="Organize, prioritize, and respond to emails automatically. Smart filtering and draft generation at your fingertips."
              gradient="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon="⏰"
              title="Smart Reminders"
              description="Never miss important tasks with intelligent reminders that adapt to your schedule and priorities."
              gradient="bg-gradient-to-r from-orange-500 to-red-500"
            />
            <FeatureCard
              icon="📞"
              title="Call Management"
              description="Handle incoming calls, schedule callbacks, and manage your communication seamlessly with voice AI."
              gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon="🔗"
              title="Integrations"
              description="Connect with 50+ popular tools and platforms. Sync data across your entire workflow ecosystem."
              gradient="bg-gradient-to-r from-teal-500 to-blue-500"
            />
          </div>
        </div>
      </section>

      <Features />

      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-gray-700 p-12 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Workflow?
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who've already revolutionized their
              productivity with our AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2024 AI Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AIBotLandingPage />} />
        <Route path="/home" element={<FrontPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  )
}

function ThemeToggleInline() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = stored ? stored === 'dark' : prefersDark
    setIsDark(shouldDark)
    document.documentElement.classList.toggle('dark', shouldDark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    const root = document.documentElement
    if (next) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="ml-2 inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      {isDark ? 'Dark' : 'Light'}
    </button>
  )
}

