
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Cpu, Eye, SlidersHorizontal, TrendingUp, Droplets, Sun, Wind, Thermometer, Sprout, Power, Github, Mail, HelpCircle, Leaf, MessageSquare, ShieldCheck, CalendarClock, Smartphone, LineChart, CloudSun, MousePointerSquareDashed, Scaling, Lightbulb } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const featureCards = [
    {
      icon: Eye,
      title: "Real-Time Coriander Monitoring",
      description: "Dedicated sensors continuously track crucial parameters like temperature, humidity, soil moisture, and light intensity, specifically calibrated for coriander's needs."
    },
    {
      icon: Cpu,
      title: "AI-Powered Smart Scheduling",
      description: "Our advanced AI analyzes historical data, real-time sensor inputs, and weather forecasts to create optimal irrigation and climate control schedules tailored for coriander's delicate growth stages."
    },
    {
      icon: SlidersHorizontal,
      title: "Automated & Manual Actuator Control",
      description: "Seamlessly manage water pumps, fans, grow lights, and ventilation systems. Let GreenGuardian automate for perfect coriander conditions, or take full manual control when needed."
    },
    {
      icon: TrendingUp,
      title: "Optimized Growth & Yield",
      description: "Achieve healthier, more aromatic coriander, reduce water and energy waste, and significantly boost your yield with intelligent, data-driven automation."
    }
  ];

  const whyCorianderBenefits = [
    { icon: Droplets, title: "Optimal Water Management", description: "Coriander requires consistent moisture but is highly susceptible to root rot. GreenGuardian ensures precise watering cycles, avoiding both under and overwatering to promote healthy root development." },
    { icon: ShieldCheck, title: "Disease Prevention & Control", description: "By maintaining ideal humidity levels, soil moisture, and air circulation, GreenGuardian significantly reduces the risk of common fungal diseases that can devastate coriander crops." },
    { icon: Lightbulb, title: "Perfect Light Exposure", description: "Automated grow light control provides coriander with the ideal light spectrum and duration (photoperiod), preventing premature bolting and encouraging lush, flavorful, and dark green leaves." },
    { icon: Wind, title: "Ideal Microclimate Creation", description: "Coriander thrives with good air circulation and benefits from cooler night temperatures. Our system intelligently manages fans and ventilation to create the perfect microclimate, enhancing growth and resilience." }
  ];

  const keyFeatures = [
     { icon: CalendarClock, title: "Intelligent AI Scheduling", description: "GPT-powered AI generates dynamic daily and weekly actuator schedules, adapting to real-time data and weather forecasts explicitly for coriander." },
     { icon: Smartphone, title: "Remote Monitoring & Control", description: "Access your greenhouse data and manage actuators from anywhere, anytime, using our intuitive and responsive web dashboard." },
     { icon: LineChart, title: "Data-Driven Insights", description: "Visualize historical sensor data with interactive charts to understand coriander growth patterns, optimize resource usage, and make informed decisions." },
     { icon: CloudSun, title: "Proactive Weather Integration", description: "GreenGuardian proactively adjusts schedules based on 7-day weather forecasts, preparing your coriander for changing conditions and minimizing stress." },
     { icon: MousePointerSquareDashed, title: "User-Friendly Interface", description: "An easy-to-navigate dashboard designed for both novice home growers and experienced commercial coriander farmers." },
     { icon: Scaling, title: "Scalable & Adaptable", description: "Whether you have a small home setup or a large commercial greenhouse, GreenGuardian can be tailored to your specific coriander cultivation needs." },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-emerald-50 to-green-100 text-gray-800 font-sans">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-primary">
            <Leaf className="h-8 w-8" />
            <span>GreenGuardian</span>
          </Link>
          <div className="space-x-2 sm:space-x-4">
            <Link href="/login" legacyBehavior passHref><Button variant="outline" size="sm" className="text-xs sm:text-sm">Login</Button></Link>
            <Link href="/dashboard" legacyBehavior passHref><Button size="sm" className="text-xs sm:text-sm">Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-white overflow-hidden">
        <Image
          src="https://picsum.photos/1600/900"
          alt="Lush green coriander farm background"
          fill
          style={{ objectFit: 'cover' }}
          className="absolute inset-0 z-0"
          data-ai-hint="coriander farm"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-800/80 via-emerald-600/60 to-transparent z-0"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
            Grow Smarter with <span className="text-lime-300">GreenGuardian</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md">
            AI-Powered Greenhouse Automation, Perfectly Tuned for Coriander Farming Success.
          </p>
          <Link href="/dashboard" legacyBehavior passHref>
            <Button size="lg" className="bg-lime-400 hover:bg-lime-500 text-green-900 font-semibold px-8 py-3 rounded-lg shadow-xl transition-transform transform hover:scale-105">
              Explore Dashboard <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">Revolutionize Your Coriander Cultivation</h2>
          <p className="text-center text-lg text-gray-600 mb-16 max-w-2xl mx-auto">GreenGuardian simplifies complex growing processes into four easy steps, ensuring your coriander gets the best care.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureCards.map((step, index) => (
              <div key={index} className="bg-lime-50 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">
                <div className="p-3 bg-emerald-100 rounded-full mb-4">
                  <step.icon className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-emerald-700">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Coriander Section */}
      <section id="why-coriander" className="py-16 md:py-24 bg-emerald-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
               <Image
                src="https://picsum.photos/600/450"
                alt="Fresh Coriander bunch with dewdrops"
                width={600}
                height={450}
                className="rounded-xl shadow-2xl object-cover w-full h-auto"
                data-ai-hint="coriander close-up"
              />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Coriander's Best Ally: GreenGuardian</h2>
              <p className="text-lg text-gray-700 mb-6">
                Coriander (Dhania) is a popular yet sensitive herb. It demands precise environmental control for optimal growth, aroma, and yield. GreenGuardian is engineered to meet its unique needs:
              </p>
              <ul className="space-y-4">
                {whyCorianderBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start p-3 bg-white/60 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-2 bg-green-100 rounded-full mr-4 mt-1 flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-700">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="key-features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">Packed with Powerful Features</h2>
          <p className="text-center text-lg text-gray-600 mb-16 max-w-2xl mx-auto">GreenGuardian offers a comprehensive suite of tools to elevate your coriander farming experience.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keyFeatures.map((feature) => (
              <Card key={feature.title} className="bg-lime-50/70 shadow-lg hover:shadow-xl transition-shadow border-transparent hover:border-emerald-200">
                <CardHeader className="flex-row items-center gap-4 pb-4">
                  <div className="p-3 bg-emerald-100 rounded-full">
                     <feature.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl text-emerald-700">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Live Preview Module Cards Section */}
      <section id="live-preview" className="py-16 md:py-24 bg-green-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">System Snapshot (Demo)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Temperature", value: "29°C", note: "Optimal for coriander", icon: Thermometer, dataHint: "thermometer temperature" },
              { title: "Humidity", value: "60%", note: "Maintaining ideal moisture", icon: Droplets, dataHint: "humidity water" },
              { title: "Soil Moisture", value: "52%", note: "Slightly dry, AI will adjust", icon: Sprout, dataHint: "soil plant" },
              { title: "Actuators", value: "Pump: ON, Fan: OFF", note: "System actively managing", icon: Power, isActuator: true, dataHint: "power settings" }
            ].map((card, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-300 border-emerald-200 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700">{card.title}</CardTitle>
                  <card.icon className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  {card.isActuator ? (
                    <>
                      <div className="text-base font-semibold text-emerald-800">Water Pump: <span className="font-bold text-green-600">ON</span></div>
                      <div className="text-base font-semibold text-emerald-800">Fan: <span className="font-bold text-red-600">OFF</span></div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-emerald-800">{card.value}</div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{card.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section id="cta" className="py-16 md:py-24 bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Elevate Your Coriander Farming?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Experience the future of precision agriculture. Sign up for GreenGuardian or schedule a personalized demo to see how we can transform your greenhouse.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
            <Link href="/login" legacyBehavior passHref>
              <Button size="lg" variant="outline" className="border-lime-300 text-lime-300 hover:bg-lime-300 hover:text-emerald-800 font-semibold px-8 py-3 rounded-lg shadow-md transition-colors w-full sm:w-auto">
                Login / Sign Up
              </Button>
            </Link>
            <Button size="lg" className="bg-lime-400 hover:bg-lime-500 text-green-900 font-semibold px-8 py-3 rounded-lg shadow-md transition-colors w-full sm:w-auto" onClick={() => alert('Thank you for your interest! Contact sales@greenguardian.dev for a demo.')}>
              Schedule Demo <MessageSquare className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-green-800 text-green-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
            <div>
              <h5 className="text-xl font-semibold mb-3 text-lime-300 flex items-center justify-center md:justify-start"><Leaf className="mr-2"/>GreenGuardian</h5>
              <p className="text-sm">AI-powered smart greenhouse automation for efficient coriander farming. Built with Next.js, Firebase, and Genkit.</p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-3 text-lime-300">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="#how-it-works" className="hover:text-lime-200 transition-colors">How It Works</Link></li>
                <li><Link href="#why-coriander" className="hover:text-lime-200 transition-colors">Why Coriander?</Link></li>
                <li><Link href="#key-features" className="hover:text-lime-200 transition-colors">Key Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-lime-200 transition-colors">Dashboard</Link></li>
                <li><Link href="/login" className="hover:text-lime-200 transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-3 text-lime-300">Connect & Support</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors"><Github className="mr-2 h-4 w-4"/> Project GitHub</a></li>
                <li><a href="mailto:contact@greenguardian.dev" className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors"><Mail className="mr-2 h-4 w-4"/> Contact Us</a></li>
                <li><a href="#" onClick={(e) => {e.preventDefault(); alert("Support: support@greenguardian.dev");}} className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors"><HelpCircle className="mr-2 h-4 w-4"/> Get Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-700 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} GreenGuardian. A project by students of FAST-NU Lahore.</p>
            <p>All rights reserved. Smart farming, simplified.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

