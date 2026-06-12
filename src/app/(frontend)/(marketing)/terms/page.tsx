import Link from 'next/link'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { TermsContent } from '@/components/terms/terms-content'

const LAST_UPDATED = 'June 12, 2026'
const CONTACT_EMAIL = 'support@flowlineworkspace.com'
const COMPANY_NAME = 'Flowline'
const COMPANY_ADDRESS = 'France'

export const metadata = {
  title: 'Terms of Service Flowline',
  description: 'Read the Flowline Terms of Service.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <TermsContent
          contactEmail={CONTACT_EMAIL}
          companyName={COMPANY_NAME}
          companyAddress={COMPANY_ADDRESS}
        />
      </main>

      <footer className="border-t border-border/60 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
