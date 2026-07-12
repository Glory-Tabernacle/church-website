import {
  CalendarDays,
  Clock3,
  UsersRound,
  Church,
  Briefcase,
  Sparkles,
  HeartHandshake,
  Sunrise,
  Megaphone,
  Footprints,
  Dumbbell,
  Music,
  type LucideIcon,
  Book,
} from 'lucide-react'
import { MountUpPushOptIn } from './mount-up-push-opt-in'

type ItemIcon =
  | 'church'
  | 'briefcase'
  | 'sparkles'
  | 'heart-handshake'
  | 'sunrise'
  | 'megaphone'
  | 'footprints'
  | 'dumbbell'
  | 'music'
  | 'book'
interface ServiceItem {
  /** Bold service name, displayed prominently on the card. */
  name: string
  /** When the service runs — e.g. "Every Sunday", "Last Sunday", "Saturdays". */
  day?: string
  /** Start time — e.g. "10:00am", "12:00am – 12:30am". Omit if all-day / no fixed time. */
  time?: string
  /** Visual identity for the service. Falls back to a generic church icon. */
  icon?: ItemIcon
}

interface ServiceColumn {
  title: string
  /** Column-header icon, separate from per-item icons. */
  icon: 'calendar' | 'clock' | 'community'
  items: ServiceItem[]
  /** Highlighted item with extra emphasis (used for daily Mount Up). */
  highlight?: ServiceItem
}

const ITEM_ICON_MAP: Record<ItemIcon, LucideIcon> = {
  church: Church,
  briefcase: Briefcase,
  sparkles: Sparkles,
  'heart-handshake': HeartHandshake,
  sunrise: Sunrise,
  megaphone: Megaphone,
  footprints: Footprints,
  dumbbell: Dumbbell,
  music: Music,
  book: Book,
}

const SERVICE_COLUMNS: ServiceColumn[] = [
  {
    title: 'Sunday Services',
    icon: 'calendar',
    items: [
      {
        name: '1st Service',
        day: 'Every Sunday',
        time: '10:00am',
        icon: 'church',
      },
      {
        name: 'Business Service',
        day: 'Coming Soon (Sunday)',
        time: '5:00pm',
        icon: 'briefcase',
      },
      {
        name: 'Celebration Service',
        day: '1st Sunday of the month',
        time: '10:00am',
        icon: 'sparkles',
      },
      {
        name: 'Anointing & Healing Service',
        day: 'Last Sunday of the month',
        time: '10:00am',
        icon: 'heart-handshake',
      },
    ],
  },
  {
    title: 'Weekly Activities',
    icon: 'calendar',
    items: [
      {
        name: 'Exploratory Bible Study',
        day: 'Wednesday',
        time: '7:00pm',
        icon: 'book',
      },
      {
        name: 'Scripts2Streets (S2S)',
        day: 'Saturdays',
        icon: 'megaphone',
      },
      {
        name: 'Prayer Walk',
        day: 'Saturdays',
        icon: 'footprints',
      },
      {
        name: 'Physical Exercise',
        day: 'Saturdays',
        icon: 'dumbbell',
      },
    ],
  },
  {
    title: 'Daily',
    icon: 'clock',
    items: [],
    highlight: {
      name: 'Mount Up',
      day: 'Every day',
      time: '12:00am – 12:30am',
      icon: 'sunrise',
    },
  },
  {
    title: 'Community',
    icon: 'community',
    items: [
      {
        name: 'Gathering of Worshippers',
        day: 'Quarterly · Friday evenings',
        icon: 'music',
      },
      {
        name: 'Divine Visitation',
        day: 'Monthly · Special 3-day prayer meeting',
        icon: 'heart-handshake',
      },
    ],
  },
]

function ColumnIcon({ icon }: { icon: ServiceColumn['icon'] }) {
  if (icon === 'clock') {
    return <Clock3 className="h-7 w-7 shrink-0" aria-hidden="true" />
  }
  if (icon === 'community') {
    return <UsersRound className="h-7 w-7 shrink-0" aria-hidden="true" />
  }
  return <CalendarDays className="h-7 w-7 shrink-0" aria-hidden="true" />
}

function ItemIconTile({
  icon,
  variant = 'default',
}: {
  icon: ItemIcon | undefined
  variant?: 'default' | 'highlight'
}) {
  const Icon = (icon && ITEM_ICON_MAP[icon]) ?? Church
  const isHighlight = variant === 'highlight'
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
      style={{
        backgroundColor: isHighlight
          ? 'rgba(0, 6, 102, 0.12)'
          : 'rgba(27, 109, 36, 0.10)',
      }}
      aria-hidden="true"
    >
      <Icon
        className="h-5 w-5"
        style={{
          color: isHighlight ? 'rgba(0, 6, 102, 1)' : 'var(--church-green)',
        }}
      />
    </div>
  )
}

function MetaRow({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm leading-tight text-gray-600">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
      {value}
    </span>
  )
}

function ServiceCard({ item }: { item: ServiceItem }) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,6,102,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,6,102,0.18)]"
    >
      <div className="flex items-start gap-3">
        <ItemIconTile icon={item.icon} />
        <div className="min-w-0 flex-1">
          <p
            className="text-base font-extrabold leading-tight"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {item.name}
          </p>
          {(item.day || item.time) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {item.day && <MetaRow icon={CalendarDays} value={item.day} />}
              {item.time && <MetaRow icon={Clock3} value={item.time} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HighlightCard({ item }: { item: ServiceItem }) {
  return (
    <div
      className="rounded-xl border border-[#c8d1e0] bg-gradient-to-br from-[#dff2ff] to-[#eaf6ff] p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <ItemIconTile icon={item.icon} variant="highlight" />
        <div className="min-w-0 flex-1">
          <p
            className="text-lg font-extrabold leading-tight"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {item.name}
          </p>
          {(item.day || item.time) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {item.day && <MetaRow icon={CalendarDays} value={item.day} />}
              {item.time && <MetaRow icon={Clock3} value={item.time} />}
            </div>
          )}
        </div>
      </div>
      {/* Mount Up push opt-in lives inside the daily-prayer highlight so it's
          discoverable exactly where the meeting is shown. */}
      <MountUpPushOptIn
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''}
      />
    </div>
  )
}

function ServiceColumnBlock({ column }: { column: ServiceColumn }) {
  return (
    <div className="min-w-0">
      <div
        className="mb-6 flex items-center gap-3"
        style={{ color: 'rgba(0, 6, 102, 1)' }}
      >
        <ColumnIcon icon={column.icon} />
        <h3 className="font-serif text-2xl font-bold leading-none tracking-normal md:text-3xl">
          {column.title}
        </h3>
      </div>

      <div className="space-y-3">
        {column.highlight && <HighlightCard item={column.highlight} />}
        {column.items.map((item) => (
          <ServiceCard key={`${column.title}-${item.name}`} item={item} />
        ))}
      </div>
    </div>
  )
}

export function ServiceDaysSection() {
  return (
    <section
      aria-labelledby="service-days-heading"
      className="relative z-10 bg-[#f7fbff] px-[var(--section-padding-x)] py-20 shadow-[0_-10px_30px_rgba(0,6,102,0.06),0_12px_34px_rgba(0,6,102,0.06)] md:py-24"
    >
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-12 text-center md:mb-16">
          <p
            className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em]"
            style={{ color: 'var(--church-green)' }}
          >
            When we gather
          </p>
          <h2
            id="service-days-heading"
            className="font-serif text-4xl font-bold leading-tight tracking-normal md:text-5xl"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            Our Services &amp; Weekly Gatherings
          </h2>
          <div
            className="mx-auto mt-5 h-1.5 w-24"
            style={{ backgroundColor: 'var(--church-red)' }}
            aria-hidden="true"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-12 xl:grid-cols-4 xl:gap-8">
          {SERVICE_COLUMNS.map((column) => (
            <ServiceColumnBlock key={column.title} column={column} />
          ))}
        </div>
      </div>
    </section>
  )
}
