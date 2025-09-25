import { Button } from "./ui/button";
import { Mail, MessageSquare, Twitter, Linkedin, Github } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Get in <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your message..."
                    ></textarea>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3"
                  >
                    Send Message
                  </Button>
                </form>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="mt-1 text-blue-400" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-400">support@chatmate.com</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="mt-1 text-blue-400" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-gray-400">Available 24/7</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    <a href="https://twitter.com/chatmate" target="_blank" rel="noopener noreferrer" 
                       className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href="https://linkedin.com/company/chatmate" target="_blank" rel="noopener noreferrer"
                       className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="https://github.com/chatmate" target="_blank" rel="noopener noreferrer"
                       className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl">
                  <h3 className="font-semibold mb-2">Join our community</h3>
                  <p className="text-sm text-gray-400 mb-4">Be the first to know about new features and updates</p>
                  <Button 
                    onClick={() => window.location.href = '/signup'}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Sign Up Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
