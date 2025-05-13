
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from "@/components/ui/slider";
import { 
  ChevronRight, Cpu, Eye, SlidersHorizontal, TrendingUp, Droplets, Sun, Wind, Thermometer, Sprout, Power, Github, Mail, HelpCircle, Leaf, MessageSquare, ShieldCheck, CalendarClock, Smartphone, LineChart, CloudSun, MousePointerSquareDashed, Scaling, Lightbulb, Waves, Bot as BotIcon, Bug as BugIcon, LayoutGrid, Fan as FanIcon, Workflow, ChevronsUpDown, Brain
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

export default function LandingPage() {
  const [plantHealth, setPlantHealth] = useState(75);

  const coreFeatures = [
    {
      icon: Eye,
      title: "Real-Time Coriander Monitoring",
      description: "Dedicated sensors continuously track crucial parameters: temperature (V1), humidity (V2), soil moisture (V3), and light intensity (V4), all optimized for coriander."
    },
    {
      icon: Cpu,
      title: "AI-Powered Smart Control",
      description: "Our advanced AI analyzes sensor data and, in 'AI Mode' (Mode), automatically manages actuators (Bulb B2, Pump B3, Fan B4, Lid B5) based on pre-set coriander thresholds."
    },
    {
      icon: CalendarClock,
      title: "Intelligent Schedule Generation",
      description: "Generate daily actuator schedules for coriander using AI, factoring in historical data and weather forecasts. Edit, save, and download schedules."
    },
    {
      icon: LineChart,
      title: "Data-Driven Insights",
      description: "Visualize historical sensor data with interactive charts. Filter by day or week to understand trends and optimize your coriander cultivation strategy."
    },
    {
      icon: BugIcon,
      title: "Pest & Disease Outlook",
      description: "Proactively assess potential pest and disease risks for your coriander with AI-driven predictions based on environmental conditions and forecasts."
    },
    {
      icon: BotIcon,
      title: "Expert AI Coriander Support",
      description: "Have questions about coriander? Our specialized AI chatbot, Green Guardian, is here to provide expert advice and tips for successful cultivation."
    }
  ];

  const whyGreenGuardianBenefits = [
    { icon: Droplets, title: "Precise Irrigation", description: "Coriander needs consistent moisture. GreenGuardian's AI mode and schedulable pump (B3) ensure optimal watering, preventing root rot and drought stress." },
    { icon: Thermometer, title: "Ideal Climate Management", description: "Maintain perfect temperature and humidity with automated fan (B4) and lid (B5) control, crucial for coriander's delicate nature and disease prevention." },
    { icon: Lightbulb, title: "Optimized Light Exposure", description: "Automated grow light (B2) control ensures your coriander receives the ideal light spectrum and duration, promoting lush, flavorful growth and preventing premature bolting." },
    { icon: ShieldCheck, title: "Proactive Protection", description: "Our Pest & Disease Outlook and AI Support Chat help you anticipate issues and care for your coriander effectively, minimizing losses and maximizing health." }
  ];
  
  const detailedFeatures = [
     { icon: LayoutGrid, title: "Interactive Dashboard", description: "View all sensor readings (V1-V4) at a glance. Manually toggle actuators (B2-B5) or switch to AI Mode for automated control. Clear visual indicators for all states." },
     { icon: Brain, title: "AI-Enhanced Scheduling", description: "Leverage Genkit AI to create dynamic 24-hour actuator schedules tailored for coriander, considering sensor history and live/mock weather data. Supports multi-day planning." },
     { icon: Smartphone, title: "Remote Access & Control", description: "Monitor your coriander's environment and manage your greenhouse from anywhere using our responsive web dashboard." },
     { icon: TrendingUp, title: "Historical Data Analysis", description: "Dive deep into your sensor logs. Interactive charts display temperature, humidity, soil moisture, and light trends. Filter by day or week for up to 7 days of history." },
     { icon: CloudSun, title: "Weather-Aware Predictions", description: "The Pest & Disease Outlook module uses weather forecasts alongside sensor data to provide actionable advice for protecting your coriander crop." },
     { icon: MousePointerSquareDashed, title: "User-Friendly Interface", description: "An intuitive and easy-to-navigate dashboard, designed for both novice home growers and experienced coriander farmers." },
  ];

  const sensorTechnology = [
    {
      name: "DHT11 Sensor",
      description: "Measures ambient temperature (V1) and humidity (V2), vital for creating the perfect microclimate for coriander and preventing fungal diseases.",
      icon: Thermometer,
      imageSrc: "https://picsum.photos/300/200",
      dataAiHint: "temperature humidity",
    },
    {
      name: "Grove Soil Moisture Sensor",
      description: "Monitors soil water content (V3), enabling precise, automated irrigation via the water pump (B3) to keep your coriander perfectly hydrated.",
      icon: Waves,
      imageSrc: "https://picsum.photos/300/200",
      dataAiHint: "soil moisture",
    },
    {
      name: "Light Dependent Resistor (LDR)",
      description: "Detects ambient light intensity (V4), ensuring coriander gets optimal light for photosynthesis, supplemented by the grow light (B2) when needed.",
      icon: Sun,
      imageSrc: "https://picsum.photos/300/200",
      dataAiHint: "light sensor",
    }
  ];
  
  const actuatorTechnology = [
    { name: "Grow Light (B2)", icon: Lightbulb, description: "Supplements natural light." },
    { name: "Water Pump (B3)", icon: Workflow, description: "Automates irrigation." },
    { name: "Fan (B4)", icon: FanIcon, description: "Regulates temperature and airflow." },
    { name: "Lid Motor (B5)", icon: ChevronsUpDown, description: "Controls ventilation." },
  ];

  const getPlantIconStyle = () => {
    const hue = 120; 
    const saturation = 40 + (plantHealth / 100) * 60; 
    const lightness = 35 + (plantHealth / 100) * 25; 
    const opacity = 0.7 + (plantHealth / 100) * 0.3; 
    const size = 50 + (plantHealth / 100) * 50; 

    return {
      color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      opacity: opacity,
      width: `${size}px`,
      height: `${size}px`,
      transition: 'all 0.3s ease-in-out',
      filter: `drop-shadow(0 0 ${plantHealth / 20}px hsl(${hue}, ${saturation}%, ${lightness - 10}%))`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-lime-200 text-gray-800 font-sans">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-md">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <Leaf className="h-8 w-8" />
            <span>GreenGuardian</span>
          </Link>
          <div className="space-x-2 sm:space-x-3">
            <Link href="/login" legacyBehavior passHref><Button variant="outline" size="sm" className="text-xs sm:text-sm border-primary text-primary hover:bg-primary/10">Login</Button></Link>
            <Link href="/dashboard" legacyBehavior passHref><Button size="sm" className="text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground">Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-28 md:py-48 text-white overflow-hidden">
        <Image
          src="https://picsum.photos/1920/1080"
          alt="Lush green coriander field with morning dew, panoramic view"
          fill
          style={{ objectFit: 'cover' }}
          className="absolute inset-0 z-0 brightness-60"
          data-ai-hint="coriander field"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-emerald-800/60 to-transparent z-0"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-lg"
            style={{ textShadow: '0 3px 6px rgba(0,0,0,0.6)' }}>
            Grow Smarter with <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-300 via-emerald-400 to-green-300">GreenGuardian</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-medium"
             style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            AI-Powered Greenhouse Automation, Perfectly Tuned for Coriander Farming Success. Maximize your yield, minimize your effort, and let your coriander thrive.
          </p>
          <Link href="/dashboard" legacyBehavior passHref>
            <Button size="lg" className="bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-500 hover:to-emerald-600 text-green-900 font-semibold px-10 py-4 rounded-lg shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl text-base">
              Explore Dashboard <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Features Overview Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">How GreenGuardian Nurtures Your Coriander</h2>
          <p className="text-center text-lg text-gray-600 mb-16 max-w-3xl mx-auto">Our integrated system provides comprehensive care for your coriander, from real-time monitoring to intelligent AI-driven actions and support.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="bg-lime-50/70 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center transform hover:-translate-y-2 border border-emerald-100 hover:border-emerald-300">
                <div className="p-4 bg-emerald-100 rounded-full mb-5 shadow-sm">
                  <feature.icon className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-emerald-700">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why GreenGuardian for Coriander Section */}
      <section id="why-coriander" className="py-16 md:py-24 bg-emerald-50/70">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
               <Image
                src="https://picsum.photos/600/450"
                alt="Close-up of fresh, vibrant coriander leaves"
                width={600}
                height={450}
                className="rounded-xl shadow-2xl object-cover w-full h-auto transform hover:scale-105 transition-transform duration-300"
                data-ai-hint="coriander leaves"
              />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Tailored for Coriander's Unique Needs</h2>
              <p className="text-lg text-gray-700 mb-8">
                Coriander (Dhania/Cilantro) is a rewarding but sensitive herb. It thrives under specific conditions, and GreenGuardian is engineered to provide exactly that:
              </p>
              <ul className="space-y-5">
                {whyGreenGuardianBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-3 bg-green-100 rounded-full mr-4 mt-1 flex-shrink-0 shadow-sm">
                      <benefit.icon className="h-7 w-7 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-green-700">{benefit.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Detailed Features Showcase */}
      <section id="detailed-features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">A Closer Look at GreenGuardian's Capabilities</h2>
          <p className="text-center text-lg text-gray-600 mb-16 max-w-3xl mx-auto">Explore the powerful tools GreenGuardian offers to elevate your coriander farming experience from seedling to harvest.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {detailedFeatures.map((feature) => (
              <Card key={feature.title} className="bg-lime-50/60 shadow-lg hover:shadow-xl transition-shadow duration-300 border-transparent hover:border-emerald-200 transform hover:scale-105 flex flex-col">
                <CardHeader className="flex-row items-center gap-4 pb-3">
                  <div className="p-3 bg-emerald-100 rounded-full shadow-sm">
                     <feature.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl text-emerald-700">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Snapshot Section (Sensors & Actuators) */}
      <section id="technology" className="py-16 md:py-24 bg-green-100/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-primary">The Tech Behind Thriving Coriander</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h3 className="text-2xl font-semibold text-emerald-700 mb-8 text-center lg:text-left">Precision Sensors</h3>
              <div className="space-y-8">
                {sensorTechnology.map((sensor) => (
                  <Card key={sensor.name} className="flex flex-col sm:flex-row items-center text-left bg-white shadow-lg hover:shadow-xl transition-shadow border-emerald-100 p-5 transform hover:scale-103">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 sm:mb-0 sm:mr-5 flex-shrink-0">
                      <Image
                        src={sensor.imageSrc}
                        alt={sensor.name}
                        fill
                        style={{ objectFit: 'contain' }}
                        className="rounded-md"
                        data-ai-hint={sensor.dataAiHint}
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center mb-1">
                        <div className="p-1.5 bg-emerald-50 rounded-full mr-2">
                          <sensor.icon className="h-5 w-5 text-emerald-500" />
                        </div>
                        <CardTitle className="text-lg text-emerald-600">{sensor.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm text-gray-600 leading-relaxed">{sensor.description}</CardDescription>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-emerald-700 mb-8 text-center lg:text-left">Smart Actuators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {actuatorTechnology.map((actuator) => (
                  <Card key={actuator.name} className="flex flex-col items-center text-center bg-white shadow-lg hover:shadow-xl transition-shadow border-emerald-100 p-5 transform hover:scale-103">
                     <div className="p-3 bg-emerald-50 rounded-full mb-3 shadow-sm">
                       <actuator.icon className="h-8 w-8 text-emerald-500" />
                     </div>
                    <CardTitle className="text-md text-emerald-600 mb-1">{actuator.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-500">{actuator.description}</CardDescription>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Plant Health Section */}
      <section id="interactive-growth" className="py-16 md:py-24 bg-gradient-to-b from-emerald-50 to-green-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Nurture Your Coriander to Perfection</h2>
          <p className="text-lg text-gray-700 mb-10 max-w-xl mx-auto">Experience how GreenGuardian's intelligent system helps your coriander flourish. Adjust the slider to visualize plant health.</p>
          <div className="flex flex-col items-center gap-8">
            <div className="p-5 bg-white rounded-full shadow-2xl" style={{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={getPlantIconStyle()} />
            </div>
            <Slider
              defaultValue={[plantHealth]}
              max={100}
              step={1}
              className="w-full max-w-md mx-auto [&>span>span]:bg-primary [&>span_span[role=slider]]:border-primary [&>span_span[role=slider]]:ring-offset-background"
              onValueChange={(value) => setPlantHealth(value[0])}
              aria-label="Plant Health Slider"
            />
            <p className="text-md text-gray-600">
              Simulated Plant Health: <span className="font-semibold text-primary">{plantHealth}%</span>
            </p>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section id="cta" className="py-16 md:py-24 bg-gradient-to-r from-primary to-emerald-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <Leaf className="h-16 w-16 mx-auto mb-6 text-lime-300 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Coriander Cultivation?</h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Join the GreenGuardian community and experience the future of smart, sustainable coriander farming. Sign up or log in to access your dashboard.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
            <Link href="/signup" legacyBehavior passHref>
              <Button size="lg" variant="outline" className="border-lime-300 text-lime-300 hover:bg-lime-300/20 hover:text-lime-200 font-semibold px-8 py-3 rounded-lg shadow-md transition-colors w-full sm:w-auto text-base">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
            <Button size="lg" className="bg-lime-400 hover:bg-lime-500 text-green-900 font-semibold px-8 py-3 rounded-lg shadow-md transition-colors w-full sm:w-auto text-base">
              Login to Dashboard <MessageSquare className="ml-2 h-5 w-5" />
            </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-green-900 text-green-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
            <div>
              <h5 className="text-xl font-semibold mb-3 text-lime-300 flex items-center justify-center md:justify-start"><Leaf className="mr-2"/>GreenGuardian</h5>
              <p className="text-sm opacity-90">AI-powered smart greenhouse automation for efficient coriander farming. Built with Next.js, Firebase, and Genkit AI.</p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-3 text-lime-300">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-lime-200 transition-colors opacity-90 hover:opacity-100">Core Features</Link></li>
                <li><Link href="#why-coriander" className="hover:text-lime-200 transition-colors opacity-90 hover:opacity-100">Why Coriander?</Link></li>
                <li><Link href="#detailed-features" className="hover:text-lime-200 transition-colors opacity-90 hover:opacity-100">Detailed Features</Link></li>
                <li><Link href="#technology" className="hover:text-lime-200 transition-colors opacity-90 hover:opacity-100">Technology Used</Link></li>
                <li><Link href="/dashboard" className="hover:text-lime-200 transition-colors opacity-90 hover:opacity-100">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-3 text-lime-300">Connect & Support</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors opacity-90 hover:opacity-100"><Github className="mr-2 h-4 w-4"/> Project GitHub</a></li>
                <li><a href="mailto:contact@greenguardian.dev" className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors opacity-90 hover:opacity-100"><Mail className="mr-2 h-4 w-4"/> Contact Us</a></li>
                <li><a href="#" onClick={(e) => {e.preventDefault(); alert("Support: support@greenguardian.dev");}} className="flex items-center justify-center md:justify-start hover:text-lime-200 transition-colors opacity-90 hover:opacity-100"><HelpCircle className="mr-2 h-4 w-4"/> Get Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-700/70 pt-8 text-center text-sm opacity-80">
            <p>&copy; {new Date().getFullYear()} GreenGuardian. A project by students of FAST-NU Lahore.</p>
            <p>Smart farming, simplified for thriving coriander.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

