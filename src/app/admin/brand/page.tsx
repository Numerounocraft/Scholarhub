import { getSiteSettings } from "@/lib/settings";
import BrandForm from "@/components/admin/BrandForm";

export const metadata = { title: "Branding — Admin" };

export default async function BrandPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Branding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the logo and brand name shown across the site.
        </p>
      </div>
      <BrandForm settings={settings} />
    </div>
  );
}
