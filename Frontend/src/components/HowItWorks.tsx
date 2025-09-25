import { Button } from "./ui/button";

export default function HowItWorks() {
  const features = [
    {
      title: "1. Sign Up & Connect",
      description: "Create your account and connect your email, calendar, and other tools you use daily.",
      icon: "📝"
    },
    {
      title: "2. Start Chatting",
      description: "Ask questions, schedule meetings, or set reminders through natural conversation.",
      icon: "💬"
    },
    {
      title: "3. Get Things Done",
      description: "Watch as ChatMate handles your tasks efficiently in the background.",
      icon: "⚡"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            How <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">It Works</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get started with ChatMate in just a few simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-lg"
            onClick={() => window.location.href = '/signup'}
          >
            Get Started for Free
          </Button>
        </div>
      </div>
    </div>
  );
}
