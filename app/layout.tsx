import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Blood-Line Navigator | Emergency Hematology Logistics',
  description: 'Autonomous blood logistics platform — real-time drone delivery, demand forecasting, and compatibility matching for emergency transfusions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, marginLeft: '240px', position: 'relative', zIndex: 1 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
