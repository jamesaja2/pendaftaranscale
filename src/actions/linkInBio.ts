"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadToFileServer, deleteFromFileServer, getPublicFileUrl } from "@/lib/fileServer";
import { randomUUID } from "crypto";

const SLIDER_SETTING_KEY = "linkinbio_slider";
const LINKS_SETTING_KEY = "linkinbio_links";
const PROFILE_SETTING_KEY = "linkinbio_profile";
const PUBLIC_PATH = "/link-in-bio";
const ADMIN_PATH = "/link-in-bio/manage";

export type LinkInBioSlide = {
  key: string;
  link?: string;
  url: string;
};

export type LinkInBioLink = {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  badge?: string;
  icon?: string;
};

export type LinkInBioProfile = {
  title: string;
  subtitle?: string;
  buttonText?: string;
  footer?: string;
  accent?: string;
  avatarUrl?: string | null;
  avatarKey?: string | null;
};

type SliderRecord = {
  key: string;
  link?: string;
};

type ProfileRecord = {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  footer?: string;
  accent?: string;
  avatarKey?: string;
};

const DEFAULT_PROFILE_RECORD: ProfileRecord = {
  title: "SCALE Bazaar",
  subtitle: "Discover the tenants and highlights",
  buttonText: "Visit Main Site",
  footer: "Powered by SCALE",
  accent: "#f97316",
};

const DEFAULT_PROFILE: LinkInBioProfile = {
  title: DEFAULT_PROFILE_RECORD.title || "SCALE Bazaar",
  subtitle: DEFAULT_PROFILE_RECORD.subtitle || "Discover the tenants and highlights",
  buttonText: DEFAULT_PROFILE_RECORD.buttonText || "Visit Main Site",
  footer: DEFAULT_PROFILE_RECORD.footer || "Powered by SCALE",
  accent: DEFAULT_PROFILE_RECORD.accent || "#f97316",
  avatarUrl: null,
  avatarKey: null,
};

const DEFAULT_LINKS: LinkInBioLink[] = [
  {
    id: "sample-1",
    title: "Official Website",
    subtitle: "All schedules & announcements",
    url: "https://scale.kopsis.web.id/",
    badge: "NEW",
  },
  {
    id: "sample-2",
    title: "Bazaar Map",
    subtitle: "Find every booth in a tap",
    url: "https://scale-smakstlouis1sby.com/map",
  },
];

function parseJSONValue<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function mapSlides(records: SliderRecord[]): LinkInBioSlide[] {
  return records
    .filter((item) => !!item?.key)
    .map((item) => ({
      key: item.key,
      link: item.link || "",
      url: getPublicFileUrl(item.key) || "",
    }))
    .filter((item) => !!item.url);
}

function parseLinks(value: string | null | undefined): LinkInBioLink[] {
  const parsed = parseJSONValue<LinkInBioLink[]>(value, DEFAULT_LINKS);
  return parsed.map((item) => ({ ...item }));
}

function parseProfile(value: string | null | undefined): LinkInBioProfile {
  const record = parseJSONValue<ProfileRecord>(value, DEFAULT_PROFILE_RECORD);
  return {
    title: record.title || DEFAULT_PROFILE.title,
    subtitle: record.subtitle || DEFAULT_PROFILE.subtitle,
    buttonText: record.buttonText || DEFAULT_PROFILE.buttonText,
    footer: record.footer || DEFAULT_PROFILE.footer,
    accent: record.accent || DEFAULT_PROFILE.accent,
    avatarKey: record.avatarKey || null,
    avatarUrl: record.avatarKey ? getPublicFileUrl(record.avatarKey) : DEFAULT_PROFILE.avatarUrl,
  };
}

async function getSettingValue(key: string) {
  const setting = await prisma.globalSettings.findUnique({ where: { key } });
  return setting?.value || null;
}

async function saveSetting(key: string, value: string) {
  await prisma.globalSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

function revalidateLinkInBio() {
  revalidatePath(PUBLIC_PATH);
  revalidatePath(ADMIN_PATH);
}

export async function getLinkInBioPublicData() {
  const [sliderRaw, linksRaw, profileRaw] = await Promise.all([
    getSettingValue(SLIDER_SETTING_KEY),
    getSettingValue(LINKS_SETTING_KEY),
    getSettingValue(PROFILE_SETTING_KEY),
  ]);

  const slides = mapSlides(parseJSONValue<SliderRecord[]>(sliderRaw, []));
  const links = parseLinks(linksRaw);
  const profile = parseProfile(profileRaw);

  return { slides, links, profile };
}

export async function getLinkInBioAdminData() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const [sliderRaw, linksRaw, profileRaw] = await Promise.all([
    getSettingValue(SLIDER_SETTING_KEY),
    getSettingValue(LINKS_SETTING_KEY),
    getSettingValue(PROFILE_SETTING_KEY),
  ]);

  const slides = mapSlides(parseJSONValue<SliderRecord[]>(sliderRaw, []));
  const links = parseLinks(linksRaw);
  const profile = parseProfile(profileRaw);

  return { success: true, slides, links, profile };
}

export async function addLinkInBioSlide(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const image = formData.get("image");
  const link = ((formData.get("link") as string) || "").trim();

  if (!(image instanceof File) || image.size === 0) {
    return { success: false, error: "Image is required" };
  }

  const ext = image.name?.split(".").pop() || "png";
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;

  try {
    const key = await uploadToFileServer(image, filename, "linkinbio");
    const sliderRaw = await getSettingValue(SLIDER_SETTING_KEY);
    const current = parseJSONValue<SliderRecord[]>(sliderRaw, []);
    current.push({ key, link });
    await saveSetting(SLIDER_SETTING_KEY, JSON.stringify(current));
    revalidateLinkInBio();
    return { success: true };
  } catch (error) {
    console.error("Failed to upload link-in-bio slide", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function deleteLinkInBioSlide(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const key = (formData.get("key") as string) || "";
  if (!key) {
    return { success: false, error: "Invalid slide" };
  }

  const sliderRaw = await getSettingValue(SLIDER_SETTING_KEY);
  const current = parseJSONValue<SliderRecord[]>(sliderRaw, []);
  const next = current.filter((item) => item.key !== key);
  if (next.length === current.length) {
    return { success: false, error: "Slide not found" };
  }

  await deleteFromFileServer(key);
  await saveSetting(SLIDER_SETTING_KEY, JSON.stringify(next));
  revalidateLinkInBio();
  return { success: true };
}

export async function createLinkInBioLink(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const title = ((formData.get("title") as string) || "").trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim();
  const url = ((formData.get("url") as string) || "").trim();
  const badge = ((formData.get("badge") as string) || "").trim();
  const icon = ((formData.get("icon") as string) || "").trim();

  if (!title || !url) {
    return { success: false, error: "Title and URL are required" };
  }

  const linksRaw = await getSettingValue(LINKS_SETTING_KEY);
  const current = parseLinks(linksRaw);
  current.push({ id: randomUUID(), title, subtitle, url, badge, icon });
  await saveSetting(LINKS_SETTING_KEY, JSON.stringify(current));
  revalidateLinkInBio();
  return { success: true };
}

export async function updateLinkInBioLink(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const id = (formData.get("id") as string) || "";
  if (!id) {
    return { success: false, error: "Invalid link" };
  }

  const title = ((formData.get("title") as string) || "").trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim();
  const url = ((formData.get("url") as string) || "").trim();
  const badge = ((formData.get("badge") as string) || "").trim();
  const icon = ((formData.get("icon") as string) || "").trim();

  if (!title || !url) {
    return { success: false, error: "Title and URL are required" };
  }

  const linksRaw = await getSettingValue(LINKS_SETTING_KEY);
  const current = parseLinks(linksRaw);
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) {
    return { success: false, error: "Link not found" };
  }

  current[index] = { id, title, subtitle, url, badge, icon };
  await saveSetting(LINKS_SETTING_KEY, JSON.stringify(current));
  revalidateLinkInBio();
  return { success: true };
}

export async function deleteLinkInBioLink(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const id = (formData.get("id") as string) || "";
  if (!id) {
    return { success: false, error: "Invalid link" };
  }

  const linksRaw = await getSettingValue(LINKS_SETTING_KEY);
  const current = parseLinks(linksRaw);
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return { success: false, error: "Link not found" };
  }

  await saveSetting(LINKS_SETTING_KEY, JSON.stringify(next));
  revalidateLinkInBio();
  return { success: true };
}

export async function updateLinkInBioProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const title = ((formData.get("title") as string) || "").trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim();
  const buttonText = ((formData.get("buttonText") as string) || "").trim();
  const footer = ((formData.get("footer") as string) || "").trim();
  const accent = ((formData.get("accent") as string) || "").trim();
  const avatar = formData.get("avatar");

  const existing = parseProfile(await getSettingValue(PROFILE_SETTING_KEY));
  const profile: ProfileRecord = {
    title: title || existing.title || DEFAULT_PROFILE.title,
    subtitle: subtitle || existing.subtitle || DEFAULT_PROFILE.subtitle,
    buttonText: buttonText || existing.buttonText || DEFAULT_PROFILE.buttonText,
    footer: footer || existing.footer || DEFAULT_PROFILE.footer,
    accent: accent || existing.accent || DEFAULT_PROFILE.accent,
    avatarKey: existing.avatarKey || undefined,
  };

  if (avatar instanceof File && avatar.size > 0) {
    const ext = avatar.name?.split(".").pop() || "png";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    try {
      const key = await uploadToFileServer(avatar, filename, "linkinbio-profile");
      if (profile.avatarKey) {
        await deleteFromFileServer(profile.avatarKey);
      }
      profile.avatarKey = key;
    } catch (error) {
      console.error("Failed to upload avatar", error);
      return { success: false, error: "Avatar upload failed" };
    }
  }

  await saveSetting(PROFILE_SETTING_KEY, JSON.stringify(profile));
  revalidateLinkInBio();
  return { success: true };
}
