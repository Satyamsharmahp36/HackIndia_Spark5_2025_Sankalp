"use client"

import * as React from 'react'
import { Home, FileText, CreditCard, Info, LogIn, UserPlus } from 'lucide-react'
import { AnimeNavBar } from './anime-navbar'

const items = [
  { name: 'Home', url: '#hero', icon: Home },
  { name: 'Features', url: '#features', icon: FileText },
  { name: 'Pricing', url: '#pricing', icon: CreditCard },
  { name: 'About', url: '#about', icon: Info },
  { name: 'Login', url: '/login', icon: LogIn },
  { name: 'Sign Up', url: '/signup', icon: UserPlus },
]

export function AnimeNavBarDemo() {
  return <AnimeNavBar items={items} defaultActive="Home" />
}


