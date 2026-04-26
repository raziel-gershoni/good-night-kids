import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { OrnamentInline } from "./ornament";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-canvas/85 backdrop-blur-sm sticky top-0 z-30">
      <div className="container mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg leading-none text-ink hover:text-brass transition-colors"
        >
          לילה טוב <span className="text-brass">·</span> ילדים
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <NavLink href="/">סיפור חופשי</NavLink>
          <span className="text-rule" aria-hidden>
            ·
          </span>
          <NavLink href="/parasha">פרשת השבוע</NavLink>
          <span className="mx-2 h-4 w-px bg-rule" aria-hidden />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="container mx-auto max-w-5xl px-6 py-8 flex flex-col items-center gap-3 text-xs text-ink-subtle">
        <OrnamentInline className="text-brass-soft opacity-70" />
        <p className="text-center">סיפורי שינה לילדים, מתוך מסורת ישראל</p>
      </div>
    </footer>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-paper-2"
    >
      {children}
    </Link>
  );
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <div className="text-center space-y-3 mb-10 paper-fade">
      {eyebrow && (
        <div className="text-xs uppercase tracking-[0.25em] text-brass">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-4xl sm:text-5xl font-light text-ink leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-ink-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
      <div className="pt-2 flex justify-center">
        <OrnamentInline className="text-brass-soft opacity-70" />
      </div>
    </div>
  );
}
