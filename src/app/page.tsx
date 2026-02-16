'use client'

import Link from 'next/link'
import { BookOpen, CheckCircle, Shield, Users, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const role = session.user.user_metadata.role
        if (role === 'instructor') router.push('/instructor/dashboard')
        else if (role === 'student') router.push('/student/dashboard')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50 to-white pt-20 pb-32 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Enhanced Student Analytics
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8">
            The standard for <span className="text-indigo-600">modern exams</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Secure, scalable, and simple. ExamNexus empowers institutions to conduct exams with confidence, providing seamless experiences for instructors and students alike.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
              Get Started Free <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to excel</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Streamline your assessment workflow with our comprehensive suite of tools designed for education.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Shield className="w-8 h-8 text-indigo-600" />,
                title: "Secure Environment",
                description: "Enterprise-grade security ensuring integrity in every assessment."
              },
              {
                icon: <Users className="w-8 h-8 text-indigo-600" />,
                title: "Class Management",
                description: "Easily organize students into classes and assign specific exams."
              },
              {
                icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
                title: "Digital Grading",
                description: "Efficient submission tracking and streamlined grading workflows."
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-300 group">
                <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="py-20 bg-indigo-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-800">
            <div className="p-4">
              <div className="text-5xl font-bold mb-2">10k+</div>
              <div className="text-indigo-200">Active Students</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-indigo-200">Institutions</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-indigo-200">Uptime Reliability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xl">
            <span className="bg-slate-900 text-white p-1 rounded">🎓</span> ExamNexus
          </div>
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} ExamNexus Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
