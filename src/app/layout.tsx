import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Where Does My Tax Go?',
  description: 'Follow an illustrative federal tax contribution through public spending.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
