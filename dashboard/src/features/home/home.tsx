"use client"

import { Navbar } from "@/components/home-bar"
import { HeroSection } from "@/components/home-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowRight, Award, Newspaper, Users } from "lucide-react"

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export default function Home() {
  const features = [
    {
      title: "Award-Winning Reporting",
      description: "Recognized nationally for investigative journalism and campus coverage.",
      icon: <Award className="h-6 w-6 text-primary" />
    },
    {
      title: "Student Perspectives",
      description: "Authentic stories written by students, for students.",
      icon: <Users className="h-6 w-6 text-primary" />
    },
    {
      title: "Multimedia Storytelling",
      description: "Innovative combinations of text, photo, and video journalism.",
      icon: <Newspaper className="h-6 w-6 text-primary" />
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Section */}
        <section className="py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold tracking-tight">
              Campus Journalism <span className="text-primary">Excellence</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              For over 75 years, we've been the trusted voice of students, covering stories that matter.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="grid gap-8 md:grid-cols-3"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={fadeUp}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {feature.icon}
                      <CardTitle>{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Sections Section */}
        <section className="py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold tracking-tight">
              Our <span className="text-primary">Coverage</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              Comprehensive reporting across all aspects of campus life
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "News", description: "Campus events and administration" },
              { name: "Sports", description: "Varsity and intramural athletics" },
              { name: "Opinion", description: "Student editorials and columns" },
              { name: "Arts & Culture", description: "Creative campus community" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center p-6 hover:bg-accent/50 transition-colors">
                  <CardTitle className="mb-2">{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-primary/10 rounded-xl p-8 text-center"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-4">
              Want to join our team?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're always looking for passionate writers, photographers, and editors.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="gap-2">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Attend Info Session
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} The Campus Chronicle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}