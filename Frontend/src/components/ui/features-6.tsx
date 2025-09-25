import { Calendar, MessageSquare, Slack, Zap, Bell, Linkedin, Bot, FileText } from 'lucide-react'

export function Features() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-semibold text-gray-900 dark:text-white">ChatMate AI brings all your productivity tools together</h2>
                    <p className="max-w-sm sm:ml-auto text-gray-600 dark:text-neutral-300">Empower your workflow with an AI assistant that adapts to your needs, whether you're scheduling meetings, managing communications, or staying organized.</p>
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-[88/36] relative">
                        <div className="bg-gradient-to-t z-1 from-black/60 dark:from-black absolute inset-0 to-transparent"></div>
                        <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=2800&h=1200&fit=crop&crop=center" className="absolute inset-0 z-10 rounded-2xl object-cover w-full h-full" alt="ChatMate AI dashboard interface" width={2797} height={1137} />
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-blue-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Smart Scheduling</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Schedule meetings effortlessly with AI-powered calendar management and conflict resolution.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-green-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Meeting Transcripts</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Get automatic transcriptions and summaries of all your meetings with key action items.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Bell className="size-4 text-yellow-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Intelligence</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Never miss important emails with AI-powered filtering and instant notifications.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Linkedin className="size-4 text-blue-500" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Social Publishing</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Automatically post updates to LinkedIn and other social platforms with AI optimization.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="size-4 text-purple-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Chat Network</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Chat with other AI assistants when yours is unavailable for continuous support.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-orange-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Call Reminders</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Never miss important calls with smart reminders and pre-call briefings.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Slack className="size-4 text-green-500" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Slack Integration</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Seamlessly connect with your Slack workspace for unified communication.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Bot className="size-4 text-cyan-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Specialized Bots</h3>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Access specific AI bots tailored for every need - from coding to content creation.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

