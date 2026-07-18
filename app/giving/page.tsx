import Image from 'next/image'
import { Building2, Globe, CreditCard, Landmark, Smartphone, Users } from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { GiveByCardForm } from './give-by-card-form'

// ---------------------------------------------------------------------------
// Giving method cards
// ---------------------------------------------------------------------------

function GivingCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5"
      style={{ boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.06)' }}
    >
      {children}
    </div>
  )
}

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'rgba(0,6,102,0.08)' }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold" style={{ color: 'rgba(0,6,102,1)' }}>{title}</h3>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold" style={{ color: 'rgba(0,6,102,1)' }}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GivingPage() {
  return (
    <>
      <TopNavBar />

      {/* ── Hero ── */}
      <section
        className="relative w-full pt-16 flex items-center"
        style={{ backgroundColor: 'rgba(0,6,102,1)', minHeight: '480px' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/imagegallery1.png"
            alt=""
            fill
            className="object-cover opacity-20"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(0,6,102,0.95) 40%, rgba(0,6,102,0.5) 100%)' }}
            aria-hidden="true"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)] py-12">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">
            Generosity from the Heart
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Your faithfulness fuels the church. Partner with us to<br />
            build a legacy of hope and light in our community.
          </p>
        </div>
      </section>

      {/* ── How to Give ── */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(249,249,249,1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          {/* Centered header */}
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <h2 className="text-2xl font-extrabold md:text-3xl" style={{ color: 'rgba(0,6,102,1)' }}>
              How to Give
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              You can now give your tithes, freewill offerings and other kingdom investments here at RCCG Glory Tabernacle, Barnstaple to support the work of God. Choose the giving option that best suits your location and preference.
            </p>
          </div>

          {/* Image + card side-by-side on desktop, stacked on mobile.
              The offering photograph gives the section a warm, human
              feel and stops the single bank card from looking lonely. */}
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10">

            {/* Offering graphic — designed flyer with account details baked
                in. Aspect ratio here (16/9) MATCHES the actual image
                (1600×900), so `object-cover` no longer crops the numbers on
                the edges. If the source file ever changes shape, update this
                aspect to match to keep the graphic fully visible. */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,6,102,0.12)]">
              <Image
                src="/offering.jpeg"
                alt="Offering & Tithe — RCCG Glory Tabernacle, Barnstaple: Account 12399462, Sort Code 30-54-66, Lloyds Bank"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Bank Transfer UK */}
            <GivingCard>
              <CardHeader
                icon={<Building2 className="h-4 w-4" style={{ color: 'rgba(0,6,102,1)' }} />}
                title="Bank Transfer (UK)"
                subtitle="Llyods bank"
              />
              <div className="flex flex-col gap-1.5 rounded-xl bg-gray-50 p-3">
                <DetailRow label="Name" value="RCCG GLORY TABERNACLE" />
                <DetailRow label="Sort Code" value="30-54-66" />
                <DetailRow label="Account" value="12399462" />
              </div>
            </GivingCard>

            {/* Bank Transfer Nigeria */}
            {/* <GivingCard>
              <CardHeader
                icon={<Landmark className="h-4 w-4" style={{ color: 'rgba(0,6,102,1)' }} />}
                title="Bank Transfer (Nigeria)"
                subtitle="Premium Trust Bank · Calvary Place"
              />
              <div className="flex flex-col gap-1.5 rounded-xl bg-gray-50 p-3">
                <DetailRow label="Name" value="RCCG Calvary Place" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Account Number</span>
                  <span className="text-xl font-extrabold tracking-wider" style={{ color: 'rgba(0,6,102,1)' }}>
                    0040215084
                  </span>
                </div>
              </div>
            </GivingCard> */}

            {/* PayPal */}
            {/* <GivingCard>
              <CardHeader
                icon={<CreditCard className="h-4 w-4" style={{ color: 'rgba(0,6,102,1)' }} />}
                title="PayPal"
                subtitle="Direct Payment"
              />
              <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Email: <span className="font-semibold text-gray-700">give@calvary.place</span></p>
                <a
                  href="https://paypal.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center rounded-lg py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'rgba(0,6,102,1)' }}
                >
                  Give via PayPal
                </a>
              </div>
            </GivingCard> */}

            {/* International Transfers */}
            {/* <GivingCard>
              <CardHeader
                icon={<Globe className="h-4 w-4" style={{ color: 'rgba(0,6,102,1)' }} />}
                title="International Transfers"
                subtitle="Wise Payments Limited"
              />
              <p className="text-xs leading-relaxed text-gray-500">
                Route payments through{' '}
                <a
                  href="https://wise.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--church-green)' }}
                >
                  Wise Payments Limited
                </a>{' '}
                using the UK account details above. Please include your full name in the transaction reference to ensure proper allocation.
              </p>
            </GivingCard> */}

            {/* Zelle */}
            {/* <GivingCard>
              <CardHeader
                icon={<Smartphone className="h-4 w-4" style={{ color: 'rgba(0,6,102,1)' }} />}
                title="Zelle (US)"
                subtitle="Recipient Email"
              />
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Recipient Email</p>
                <p className="text-sm font-bold" style={{ color: 'rgba(0,6,102,1)' }}>
                  calvaryplace1@gmail.com
                </p>
              </div>
            </GivingCard> */}

          </div>
        </div>
      </section>

      {/* ── Give by Card (Stripe) ── */}
      <section
        className="w-full py-14 px-[var(--section-padding-x)]"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <h2
              className="text-2xl font-extrabold md:text-3xl"
              style={{ color: 'rgba(0,6,102,1)' }}
            >
              Give by card
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              A one-off gift, a monthly standing gift, this Sunday&rsquo;s
              offering, or freewill / seed — pay securely by card with just a
              few taps. If you&rsquo;re a UK taxpayer you can add Gift Aid at no
              extra cost.
            </p>
          </div>
          <GiveByCardForm />

          {/* "Already a monthly donor?" — quiet link so people know how
              to update their card or cancel without emailing the church. */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Already a monthly donor?{' '}
            <a
              href="/giving/manage"
              className="font-semibold text-[#000666] underline-offset-4 hover:underline"
            >
              Manage your gift
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── In-Person Giving + Scripture ── */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(249,249,249,1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* In-Person card */}
            <div
              className="flex flex-col gap-4 rounded-2xl p-6"
              style={{ backgroundColor: 'rgba(0,6,102,1)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white">In-Person Giving</h3>
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Tithes and offerings are received at all regular Sunday morning services during our giving moments and we collect all donations coming from the congregation and guests.
              </p>
            </div>

            {/* Scripture quote */}
            <div
              className="flex items-center rounded-2xl bg-white p-6 border-l-4"
              style={{
                borderColor: 'var(--church-green)',
                boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.06)',
              }}
            >
              <blockquote className="text-sm italic leading-relaxed text-gray-600">
                <span className="text-2xl font-black not-italic" style={{ color: 'var(--church-green)' }}>"</span>
                Bring the whole tithe into the storehouse... and see if I will not throw open the floodgates of heaven.
                <footer className="mt-2 text-xs font-bold not-italic" style={{ color: 'rgba(0,6,102,1)' }}>
                  — Malachi 3:10
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(235,241,250,1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold md:text-3xl" style={{ color: 'rgba(0,6,102,1)' }}>
                Never Miss a Moment.
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                Subscribe to our weekly newsletter for liturgical readings, upcoming events, and stories of transformation from our community.
              </p>
              <NewsletterForm />
            </div>
            <div className="relative overflow-hidden rounded-2xl" style={{ height: '220px' }}>
              <Image
                src="/fellowship.png"
                alt="Church community hands together"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Recovering the past, restoring the present, and reviving the future."
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Media', href: '/sermons' },
              { label: 'Volunteer', href: '/volunteer' },
              { label: 'Contact', href: '/contact' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: 'https://www.instagram.com/rccgglorytabernaclebarnstaple?igsh=MWtiZDR3bmVydXp5OA%3D%3D&utm_source=qr' },
          { platform: 'youtube', href: 'https://www.youtube.com/@glorytabernaclehq' },
          { platform: 'facebook', href: 'https://www.facebook.com/share/1BZ95ArbRf/?mibextid=wwXIfr' },
          { platform: 'x', href: 'https://x.com/rccggthq' },
          { platform: 'tiktok', href: 'https://www.tiktok.com/@rccgglorytabernaclebarns?_r=1&_t=ZN-965RffiNMP8X' },
        ]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+44 (0) 1234 567890',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com/?q=North+Devon+College+Barnstaple+EX31+2BQ',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
