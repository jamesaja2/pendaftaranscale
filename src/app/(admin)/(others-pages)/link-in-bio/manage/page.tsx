import type { Metadata } from "next";
import {
  getLinkInBioAdminData,
  addLinkInBioSlide,
  deleteLinkInBioSlide,
  createLinkInBioLink,
  updateLinkInBioLink,
  deleteLinkInBioLink,
  updateLinkInBioProfile,
  type LinkInBioLink,
} from "@/actions/linkInBio";
import { HeroSettingsForm } from "./HeroSettingsForm";
import { SliderManager } from "./SliderManager";

export const metadata: Metadata = {
  title: "Link in Bio Manager",
  description: "Configure the mobile link hub",
};

async function handleUpdateProfile(formData: FormData) {
  "use server";
  await updateLinkInBioProfile(formData);
}

async function handleAddSlide(formData: FormData) {
  "use server";
  await addLinkInBioSlide(formData);
}

async function handleDeleteSlide(formData: FormData) {
  "use server";
  await deleteLinkInBioSlide(formData);
}

async function handleCreateLink(formData: FormData) {
  "use server";
  await createLinkInBioLink(formData);
}

async function handleUpdateLink(formData: FormData) {
  "use server";
  await updateLinkInBioLink(formData);
}

async function handleDeleteLink(formData: FormData) {
  "use server";
  await deleteLinkInBioLink(formData);
}

export default async function LinkInBioManagerPage() {
  const data = await getLinkInBioAdminData();

  if (!data.success) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {data.error || "Unauthorized"}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <HeroSettingsForm profile={data.profile} onSubmit={handleUpdateProfile} />
      <SliderManager
        slides={data.slides}
        onAddSlide={handleAddSlide}
        onDeleteSlide={handleDeleteSlide}
      />
      <LinkManager links={data.links} />
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{description}</h2>
      </div>
      {children}
    </section>
  );
}

function LinkManager({ links }: { links: LinkInBioLink[] }) {
  return (
    <Section title="Links" description="Curate every CTA order.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {links.map((link) => (
            <div key={link.id} className="rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
              <form action={handleUpdateLink} className="space-y-3 text-sm">
                <input type="hidden" name="id" value={link.id} />
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={link.title}
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    defaultValue={link.subtitle}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">URL</label>
                  <input
                    type="url"
                    name="url"
                    defaultValue={link.url}
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-500">Badge</label>
                    <input
                      type="text"
                      name="badge"
                      defaultValue={link.badge}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-500">Icon (emoji)</label>
                    <input
                      type="text"
                      name="icon"
                      defaultValue={link.icon}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-brand-600 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-700"
                  >
                    Save
                  </button>
                </div>
              </form>
              <form action={handleDeleteLink} className="mt-3 text-right">
                <input type="hidden" name="id" value={link.id} />
                <button type="submit" className="text-xs font-semibold text-red-500 hover:text-red-600">
                  Delete Link
                </button>
              </form>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 p-6 dark:border-gray-700">
          <form action={handleCreateLink} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Ticketing"
                required
                className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Subtitle</label>
              <input
                type="text"
                name="subtitle"
                placeholder="Book your seat"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">URL</label>
              <input
                type="url"
                name="url"
                placeholder="https://"
                required
                className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Badge</label>
                <input
                  type="text"
                  name="badge"
                  placeholder="LIVE"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Icon</label>
                <input
                  type="text"
                  name="icon"
                  placeholder="🔥"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition hover:bg-black"
              >
                Add Link
              </button>
            </div>
          </form>
        </div>
      </div>
    </Section>
  );
}
