import type { Metadata } from "next";
import Link from "next/link";
import { getLinkInBioPublicData } from "@/actions/linkInBio";

export const metadata: Metadata = {
  title: "Link in Bio | SCALE Bazaar",
  description: "All SCALE Bazaar links in one mobile hub",
};

export default async function LinkInBioPage() {
  const { profile, slides, links } = await getLinkInBioPublicData();
  const accent = profile.accent || "#f97316";
  const primaryLink = links[0];

  return (
    <div className="min-h-screen bg-[#f3f6ff] py-12">
      <div className="mx-auto flex max-w-6xl justify-center px-4">
        <div className="w-full max-w-[420px] rounded-[32px] border border-slate-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="space-y-8 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              {profile.avatarUrl ? (
                <div className="relative">
                  <span
                    className="absolute inset-0 rounded-3xl opacity-60"
                    style={{ background: `${accent}22` }}
                  ></span>
                  <img
                    src={profile.avatarUrl}
                    alt={profile.title}
                    className="relative h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-slate-100 text-sm font-semibold text-slate-500">
                  SCALE
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Official Link Hub</p>
                <h1 className="mt-3 text-2xl font-black text-slate-900">{profile.title}</h1>
                {profile.subtitle && <p className="mt-2 text-sm text-slate-500">{profile.subtitle}</p>}
              </div>
              {primaryLink && (
                <Link
                  href={primaryLink.url}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200/70"
                  style={{ background: accent }}
                >
                  {profile.buttonText || "Open Highlight"}
                  <span aria-hidden>↗</span>
                </Link>
              )}
            </div>

            {slides.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Highlights</p>
                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]">
                  {slides.map((slide, index) => (
                    slide.link ? (
                      <a
                        key={slide.key}
                        href={slide.link}
                        target="_blank"
                        rel="noreferrer"
                        className="snap-center shrink-0 basis-full overflow-hidden rounded-3xl border border-slate-100 shadow-lg"
                      >
                        <div className="relative h-56">
                          <img src={slide.url} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
                          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            Tap to explore
                          </span>
                        </div>
                      </a>
                    ) : (
                      <div
                        key={slide.key}
                        className="snap-center shrink-0 basis-full overflow-hidden rounded-3xl border border-slate-100 shadow-lg"
                      >
                        <img src={slide.url} alt={`Slide ${index + 1}`} className="h-56 w-full object-cover" />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">All Links</p>
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
                          {link.icon && <span className="text-lg text-slate-500">{link.icon}</span>}
                          {link.title}
                        </p>
                        {link.subtitle && <p className="text-sm text-slate-500">{link.subtitle}</p>}
                      </div>
                      {link.badge && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          {link.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {profile.footer && (
              <p className="pt-4 text-center text-[11px] uppercase tracking-[0.35em] text-slate-400">{profile.footer}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
