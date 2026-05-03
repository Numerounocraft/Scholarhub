"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/settings";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "block text-sm font-medium mb-1";

export default function BrandForm({ settings }: { settings: SiteSettings }) {
  const [brandName, setBrandName] = useState(settings.brand_name);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_name: brandName, logo_url: logoUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to save.");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  const isExternal = logoUrl.startsWith("http");

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      {/* Logo preview */}
      <div className="rounded-xl border bg-muted/30 p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </p>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl || "/logo.svg"}
            alt="Logo preview"
            className="h-8 w-8 rounded-md object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg"; }}
          />
          <span className="text-sm font-semibold tracking-tight">
            {brandName || "ScholarHub"}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This is how your brand appears in the site header.
        </p>
      </div>

      {/* Brand name */}
      <div>
        <label className={labelClass}>
          Brand name <span className="text-destructive">*</span>
        </label>
        <input
          required
          type="text"
          value={brandName}
          onChange={(e) => { setBrandName(e.target.value); setSaved(false); }}
          placeholder="ScholarHub"
          maxLength={60}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Shown next to the logo in the header.
        </p>
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelClass}>
          Logo URL <span className="text-destructive">*</span>
        </label>
        <input
          required
          type="text"
          value={logoUrl}
          onChange={(e) => { setLogoUrl(e.target.value); setSaved(false); }}
          placeholder="https://… or /logo.svg"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use <code className="rounded bg-muted px-1">/logo.svg</code> for the default,
          or paste any public image URL (PNG, SVG, WebP).
          {isExternal && (
            <span className="ml-1 text-amber-600">
              External URLs may be blocked by CORS — prefer a URL on your own domain.
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <div>
          {saved && <p className="text-sm text-emerald-600 font-medium">Saved — refresh the site to see changes.</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
