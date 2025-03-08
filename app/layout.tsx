import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import './globals.css'
import Navbar from '@/components/landing_page/navbar'
import { Toaster } from "@/components/ui/toaster"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <Navbar/>
            {children}
          </SignedIn>
          <Toaster/>
        </body>
      </html>
    </ClerkProvider>
  )
}