"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Book, Newspaper, PenSquare, Info } from 'lucide-react'
import { ThemeSwitch } from './theme-switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Link } from '@tanstack/react-router'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const resourceItems = [
    {
      title: "Documentation",
      icon: <Book className="w-5 h-5" />,
      description: "Comprehensive guides and API references"
    },
    {
      title: "News",
      icon: <Newspaper className="w-5 h-5" />,
      description: "Latest updates and announcements"
    },
    {
      title: "Blog",
      icon: <PenSquare className="w-5 h-5" />,
      description: "Articles and insights from our team"
    },
    {
      title: "About",
      icon: <Info className="w-5 h-5" />,
      description: "Learn about our company and mission"
    }
  ]

  return (
    <Card className="fixed left-[35px] right-[35px] top-[35px] mx-auto rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo - Left Aligned */}
        <div className="flex items-center">
          <Link to="/" className="flex-shrink-0 font-bold text-xl">Technique</Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2 space-x-8">
          <Link 
            to="/" 
            className="text-foreground hover:text-foreground/80 transition-colors [&.active]:font-medium"
            activeProps={{ className: "font-medium" }}
          >
            Home
          </Link>
          <Link 
            to="/" 
            className="text-foreground hover:text-foreground/80 transition-colors [&.active]:font-medium"
            activeProps={{ className: "font-medium" }}
          >
            About
          </Link>
          <Link 
            to="/" 
            className="text-foreground hover:text-foreground/80 transition-colors [&.active]:font-medium"
            activeProps={{ className: "font-medium" }}
          >
            Troubleshoot
          </Link>

          {/* Resources Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Resources <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2">
              {resourceItems.map((item) => (
                <DropdownMenuItem key={item.title} className="flex items-start gap-3 p-3">
                  <div className="text-foreground">{item.icon}</div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-foreground/70">{item.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Buttons - Right Aligned */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/sign-in">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/sign-up">Sign Up</Link>
            </Button>
          </div>
          <ThemeSwitch />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-t border-foreground/10 overflow-hidden"
          >
            <div className="px-4 py-2 space-y-4">
              <Link
                to="/"
                className="block py-2 text-foreground hover:text-foreground/80 transition-colors [&.active]:font-medium"
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{ className: "font-medium" }}
              >
                Home
              </Link>
              <Link
                to="/"
                className="block py-2 text-foreground hover:text-foreground/80 transition-colors [&.active]:font-medium"
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{ className: "font-medium" }}
              >
                About
              </Link>
              <Link
                to="/"
                className="block py-2 text-foreground hover:text-foreground/80 transition-colors [&.active]:font-medium"
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{ className: "font-medium" }}
              >
                Troubleshoot
              </Link>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    Resources <ChevronDown className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Resources</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-4">
                    {resourceItems.map((item) => (
                      <Button
                        key={item.title}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-3"
                      >
                        <div className="text-foreground">{item.icon}</div>
                        <div className="text-left">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-foreground/70">{item.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>

              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}