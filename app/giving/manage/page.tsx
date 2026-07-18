import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { ManageForm } from './manage-form'
import { AlertCircle, HeartHandshake } from 'lucide-react'

export const metadata = {
  title: 'Manage my monthly gift | RCCG Glory Tabernacle, Barnstaple',
  description:
    'Update your card, view past receipts, or cancel your monthly gift to RCCG Glory Tabernacle, Barnstaple.',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

const ERROR_COPY: Record<string, string> = {
  expired:
    'That link has expired or is not valid. Please request a fresh one below.',
  no_customer:
    'We couldn’t find a gift for that email. If you gave under a different email, try that one instead.',
  error:
    'Something went wrong opening your billing portal. Please try again — if it happens twice, email admin@glorytabernacle.co.uk.',
}

export default async function ManageGivingPage({ searchParams }: PageProps) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_COPY[error] : null

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4] pt-16">
        <section className="px-[var(--section-padding-x)] py-16 md:py-24">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#000666]/8">
                <HeartHandshake className="h-7 w-7 text-[#000666]" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
                Manage my monthly gift
              </p>
              <h1 className="mt-3 text-3xl font-extrabold text-[#000666] md:text-4xl">
                Update, pause, or cancel
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-600 md:text-base">
                Enter the email you used when setting up your monthly gift and
                we&rsquo;ll send you a secure link to your billing portal.
                From there you can change your card, view past receipts, or
                cancel any time.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <ManageForm />

            <p className="mt-8 text-center text-xs text-gray-500">
              Not a monthly donor?{' '}
              <Link
                href="/giving"
                className="font-semibold text-[#000666] underline-offset-4 hover:underline"
              >
                Give a one-off gift instead
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish · Transform · Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'Events', href: '/events' },
              { label: 'Giving', href: '/giving' },
              { label: 'Contact', href: '/contact' },
            ],
          },
        ]}
        socialLinks={[]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+447478137599',
          email: 'admin@glorytabernacle.co.uk',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
