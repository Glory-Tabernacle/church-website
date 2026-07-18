import Image from 'next/image'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { GivingOptions } from './giving-options'

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

      {/* ── How to Give — tabbed layout ── */}
      <section
        className="w-full py-14 px-[var(--section-padding-x)] md:py-16"
        style={{ backgroundColor: 'rgba(249,249,249,1)' }}
      >
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <h2
              className="text-2xl font-extrabold md:text-3xl"
              style={{ color: 'rgba(0,6,102,1)' }}
            >
              How to Give
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              You can now give your tithes, freewill offerings and other kingdom
              investments to support the work of God at RCCG Glory Tabernacle,
              Barnstaple. Pick the option that suits you best.
            </p>
          </div>
          <GivingOptions />
        </div>
      </section>

      {/* ── Scripture ── */}
      <section
        className="w-full py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(255,255,255,1)' }}
      >
        <div className="mx-auto max-w-3xl">
          <div
            className="flex items-center rounded-2xl bg-white p-6 border-l-4 md:p-8"
            style={{
              borderColor: 'var(--church-green)',
              boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.06)',
            }}
          >
            <blockquote className="text-base italic leading-relaxed text-gray-600 md:text-lg">
              <span
                className="text-3xl font-black not-italic"
                style={{ color: 'var(--church-green)' }}
              >
                &ldquo;
              </span>
              Bring the whole tithe into the storehouse&hellip; and see if I
              will not throw open the floodgates of heaven.
              <footer
                className="mt-2 text-xs font-bold not-italic md:text-sm"
                style={{ color: 'rgba(0,6,102,1)' }}
              >
                — Malachi 3:10
              </footer>
            </blockquote>
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
