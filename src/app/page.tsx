
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Cpu, Eye, SlidersHorizontal, TrendingUp, Droplets, Sun, Wind, Thermometer, Sprout, Power, Github, Mail, HelpCircle, Leaf, MessageSquare, CheckCircle, ShieldOff } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
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
        <div className="absolute inset-0 bg-gradient-to-t from-green-800/70 via-emerald-600/50 to-transparent z-0"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
            Grow Smarter with <span className="text-lime-300">GreenGuardian</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-sm">
            AI-Powered Greenhouse Automation for Coriander Farming
          </p>
          <Link href="/dashboard" legacyBehavior passHref>
            <Button size="lg" className="bg-lime-400 hover:bg-lime-500 text-green-900 font-semibold px-8 py-3 rounded-lg shadow-xl transition-transform transform hover:scale-105">
              View Dashboard <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-primary">How GreenGuardian Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Eye, title: "Real-Time Monitoring", description: "Sensors track temperature, humidity, soil moisture, and light specifically for your coriander crops." },
              { icon: Cpu, title: "AI Scheduling", description: "Our advanced AI analyzes data trends and weather forecasts to create optimal irrigation schedules for coriander." },
              { icon: SlidersHorizontal, title: "Actuator Control", description: "Seamlessly control water pumps, fans, grow lights, and lid motors — automatically or with manual overrides." },
              { icon: TrendingUp, title: "Optimized Results", description: "Achieve healthier coriander, reduce water usage, and potentially increase your yield with smart automation." }
            ].map((step, index) => (
              <div key={index} className="bg-lime-50 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center">
                <step.icon className="h-12 w-12 text-emerald-600 mb-4" />
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
                src="https://picsum.photos/600/400"
                alt="Fresh Coriander bunch"
                width={600}
                height={400}
                className="rounded-xl shadow-2xl object-cover w-full h-auto"
                data-ai-hint="coriander leaves"
              />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Why Coriander Thrives with GreenGuardian</h2>
              <p className="text-lg text-gray-700 mb-6">
                Coriander (Dhania) is a popular herb that benefits greatly from precise environmental control. GreenGuardian helps you meet its specific needs:
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Droplets, title: "Moderate Water Needs", description: "Avoids overwatering and root rot, common issues with coriander." },
                  { icon: ShieldOff, title: "Moisture Sensitivity", description: "Precise irrigation prevents fungal diseases and promotes healthy growth." },
                  { icon: Sun, title: "Careful Light Exposure", description: "Optimized lighting schedules prevent bolting and ensure lush leaves." },
                  { icon: Wind, title: "Night-Time Cooling", description: "Automated fan control helps maintain ideal temperatures, especially during warmer nights." }
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <benefit.icon className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                    <span><span className="font-semibold">{benefit.title}:</span> {benefit.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Module Cards Section */}
      <section id="live-preview" className="py-16 md:py-24 bg-green-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">System Snapshot (Demo)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Temperature", value: "29°C", note: "Optimal for coriander", icon: Thermometer },
              { title: "Humidity", value: "60%", note: "Maintaining ideal moisture", icon: Droplets },
              { title: "Soil Moisture", value: "52%", note: "Ready for irrigation", icon: Sprout },
              { title: "Actuators", value: "Pump: ON, Fan: OFF", note: "System actively managing", icon: Power, isActuator: true }
            ].map((card, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-300 border-emerald-200">
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Monitoring Your Crops Today!</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Join GreenGuardian and revolutionize your coriander farming with smart, AI-driven automation.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
            <Link href="/login" legacyBehavior passHref>
              <Button size="lg" variant="outline" className="border-lime-300 text-lime-300 hover:bg-lime-300 hover:text-emerald-800 font-semibold px-8 py-3 rounded-lg shadow-md transition-colors w-full sm:w-auto">
                Login
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
              <p className="text-sm">AI-powered smart greenhouse automation for efficient farming.</p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-3 text-lime-300">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="#how-it-works" className="hover:text-lime-200 transition-colors">How It Works</Link></li>
                <li><Link href="#why-coriander" className="hover:text-lime-200 transition-colors">Why Coriander?</Link></li>
                <li><Link href="/dashboard" className="hover:text-lime-200 transition-colors">Dashboard</Link></li>
                <li><Link href="/login" className="hover:text-lime-200 transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-3 text-lime-300">Connect</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors"><Github className="mr-2 h-4 w-4"/> GitHub</a></li>
                <li><a href="mailto:contact@greenguardian.dev" className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors"><Mail className="mr-2 h-4 w-4"/> Contact Us</a></li>
                <li><a href="#" onClick={(e) => {e.preventDefault(); alert("Support: support@greenguardian.dev");}} className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors"><HelpCircle className="mr-2 h-4 w-4"/> Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-700 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} GreenGuardian. Project by FAST-NU Lahore Students.</p>
            <p>All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

