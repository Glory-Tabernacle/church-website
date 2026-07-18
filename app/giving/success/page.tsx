import Link from 'next/link'
import { CheckCircle2, Heart } from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { prisma } from '@/lib/prisma'
import {
  DONATION_TYPE_META,
  formatPence,
  formatReceiptNumber,
} from '@/lib/types/donation'

/**
 * Thank-you page after Stripe redirects the donor back post-payment.
 * The donation id comes from the query param we appended on the success
 * URL when creating the Checkout session.
 *
 * Note: the webhook may or may not have fired yet by the time the
 * donor lands here (~1–2s race). We render the receipt info from the
 * PENDING row and just say "we've received your gift, receipt on its way".
 */

export const metadata = {
  title: 'Thank you — RCCG Glory Tabernacle, Barnstaple',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ donation?: string; session_id?: string }>
}

export default async function GivingSuccessPage({ searchParams }: PageProps) {
  const { donation: donationId } = await searchParams

  let donation = null
  if (donationId) {
    try {
      donation = await prisma.donation.findUnique({
        where: { id: donationId },
        select: {
          receiptNumber: true,
          firstName: true,
          amountPence: true,
          currency: true,
          giftType: true,
          giftAidClaimed: true,
          email: true,
        },
      })
    } catch (err) {
      console.error('Success page donation lookup failed:', err)
    }
  }

  const receiptId = donation
    ? formatReceiptNumber(donation.receiptNumber)
    : null
  const amountLabel = donation
    ? formatPence(donation.amountPence, donation.currency.toUpperCase())
    : null
  const typeLabel = donation ? DONATION_TYPE_META[donation.giftType].label : null

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4] pt-16">
        <section className="px-[var(--section-padding-x)] py-16 md:py-24">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1b6d24]/10">
              <CheckCircle2 className="h-9 w-9 text-[#1b6d24]" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
              Gift received
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-[#000666] md:text-4xl">
              Thank you{donation ? `, ${donation.firstName}` : ''}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
              Your gift has been received. A receipt is on its way to your inbox
              in a moment.
            </p>

            {donation && (
              <div className="mx-auto mt-8 max-w-md rounded-xl border border-[#dde3f2] bg-[#f4f7ff] px-6 py-6 text-left">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#000666]">
                      Amount
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-[#000666]">
                      {amountLabel}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-[#1b6d24]" aria-hidden="true" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#dde3f2] pt-4">
                  <div>
                    <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
                      Receipt
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-[#000666]">
                      {receiptId}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
                      Type
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#000666]">
                      {typeLabel}
                    </p>
                  </div>
                </div>
                {donation.giftAidClaimed && (
                  <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-[#1b6d24]">
                    Gift Aid confirmed — every £1 becomes £1.25 to the church.
                  </p>
                )}
              </div>
            )}

            <p className="mt-8 text-xs leading-relaxed text-gray-500">
              &ldquo;Bring the whole tithe into the storehouse&hellip; and see if I
              will not throw open the floodgates of heaven.&rdquo;
              <br />
              — Malachi 3:10
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#000666] underline-offset-4 hover:underline"
              >
                Back to homepage
              </Link>
            </div>
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
