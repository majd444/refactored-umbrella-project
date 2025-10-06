import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ArrowRight, Users, Bot, } from "lucide-react"

interface HeroProps {
  onOpenAuth: (type: "login" | "signup") => void
}

const Hero = ({ onOpenAuth }: HeroProps) => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 hover:bg-blue-200 transition-all duration-300 border-blue-200">
          <Bot className="w-4 h-4 mr-2" />
          No-Code AI Agent Platform
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-gray-900">Create and Manage Your</span>
          <br />
          <span className="text-gray-900">
            AI Agents
          </span>
          <br />
          <span className="text-gray-900">with Ease</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
          Build, customize, and deploy AI agents for your business needs without writing a single line of code. I&apos;ve been using this platform for a month and it&apos;s completely transformed how I handle customer support. The AI is incredibly intuitive and easy to train.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button
            size="lg"
            onClick={() => onOpenAuth("signup")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg group shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onOpenAuth("login")}
            className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg hover:bg-blue-50 transition-all duration-300"
          >
            <Users className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>
        
        {/* Chatbot demo removed as requested */}
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-1/2 left-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-lg"></div>
    </section>
  )
}

export default Hero
