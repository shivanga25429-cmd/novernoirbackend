import Link from 'next/link';
import { AlertTriangle, CheckCircle2, KeyRound, Package, Settings, ShoppingCart, TicketPercent, Users } from 'lucide-react';

const sqlFiles = [
  {
    title: 'Out of stock column',
    path: 'nover-noir-luxury-platform/supabase-add-out-of-stock.sql',
    purpose: 'Adds is_out_of_stock to public.products.',
  },
  {
    title: 'Coupons tables',
    path: 'nover-noir-luxury-platform/supabase-coupons.sql',
    purpose: 'Adds coupons, coupon_redemptions, and coupon fields on orders.',
  },
];

const couponTypes = [
  {
    title: 'One-time code',
    value: 'expires_after_use = true',
    detail: 'The code locks when payment starts and cannot be used again while pending or after confirmation.',
  },
  {
    title: 'Reusable until disabled',
    value: 'expires_after_use = false',
    detail: 'Customers can keep using it while is_active is true. Disable it from Coupons by clicking Set false.',
  },
  {
    title: 'Specific user coupon',
    value: 'Specific User Email is filled',
    detail: 'Only the account with that email can apply the coupon at checkout.',
  },
  {
    title: 'Public coupon',
    value: 'Specific User Email is blank',
    detail: 'Any signed-in customer can apply it, subject to the other coupon rules.',
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
      <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function AdminGuide() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Admin Guide</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Use this page as the operating checklist for products, stock, coupons, users, orders, and settings.
        </p>
      </div>

      <Section title="Before Using New Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sqlFiles.map((file) => (
            <div key={file.path} className="border border-zinc-800 rounded p-4 bg-zinc-950">
              <p className="text-sm font-medium text-amber-400">{file.title}</p>
              <code className="block text-xs text-zinc-300 mt-2 break-all">{file.path}</code>
              <p className="text-xs text-zinc-500 mt-2">{file.purpose}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 rounded border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Run these SQL files manually in Supabase SQL Editor. If a feature errors with a missing column or table, the matching SQL file has not been run on that Supabase project.
          </p>
        </div>
      </Section>

      <Section title="Admin Access">
        <ul className="space-y-3">
          <Step>Open <code className="text-amber-400">/admin/login</code> in the API app.</Step>
          <Step>Use the admin username and password configured in the API environment variables.</Step>
          <Step>Admin sessions are stored in browser session storage. Use Sign Out before handing over the device.</Step>
          <Step>To change the admin password, update <code className="text-amber-400">ADMIN_PASSWORD_HASH</code> in the API environment.</Step>
        </ul>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Products">
          <ul className="space-y-3">
            <Step>Go to <Link href="/admin/products" className="text-amber-400 hover:underline">Products</Link> to add or edit products.</Step>
            <Step>Use Selling Price as the current customer price.</Step>
            <Step>Use MRP / Original to show a strikethrough price and discount badge.</Step>
            <Step>Use Visible to customers / Hidden from shop to control whether the product appears publicly.</Step>
            <Step>Use In stock / Out of stock to keep the product visible while blocking add-to-cart and checkout purchase.</Step>
          </ul>
        </Section>

        <Section title="Coupons">
          <ul className="space-y-3">
            <Step>Go to <Link href="/admin/coupons" className="text-amber-400 hover:underline">Coupons</Link> and enter the coupon code.</Step>
            <Step>Choose Percentage for percent discounts or Fixed ₹ for a flat rupee discount.</Step>
            <Step>Leave Product IDs blank to apply the coupon to all cart items.</Step>
            <Step>Enter comma-separated product IDs to discount only those products, for example <code className="text-amber-400">midnight-rush, oud-sovereign</code>.</Step>
            <Step>Enter Specific User Email to restrict the coupon to one customer account.</Step>
            <Step>Use Set false to disable a reusable coupon. Use Set true to enable it again.</Step>
          </ul>
        </Section>
      </div>

      <Section title="Coupon Rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {couponTypes.map((type) => (
            <div key={type.title} className="border border-zinc-800 rounded p-4 bg-zinc-950">
              <p className="text-sm font-medium text-zinc-100">{type.title}</p>
              <code className="block text-xs text-amber-400 mt-2">{type.value}</code>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{type.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The checkout preview validates coupons for the customer, but the payment API validates again using live Supabase data. Customers cannot change the discount amount from the browser.
        </p>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Orders">
          <ul className="space-y-3">
            <Step>Go to <Link href="/admin/orders" className="text-amber-400 hover:underline">Orders</Link> to review customer orders.</Step>
            <Step>Coupon data is saved on the order as <code className="text-amber-400">coupon_code</code> and <code className="text-amber-400">discount_amount</code>.</Step>
            <Step>Confirmed one-time coupons stay locked. Failed signature verification releases the coupon lock.</Step>
          </ul>
        </Section>

        <Section title="Users">
          <ul className="space-y-3">
            <Step>Go to <Link href="/admin/users" className="text-amber-400 hover:underline">Users</Link> to find a customer email before creating a specific-user coupon.</Step>
            <Step>The coupon form expects the email exactly as it exists in the users table.</Step>
          </ul>
        </Section>
      </div>

      <Section title="Settings And Carts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <Settings className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Use <Link href="/admin/settings" className="text-amber-400 hover:underline">Settings</Link> to edit shipping charge and free-shipping threshold.
            </p>
          </div>
          <div className="flex gap-3">
            <ShoppingCart className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Use <Link href="/admin/carts" className="text-amber-400 hover:underline">Carts</Link> to inspect active customer cart records.
            </p>
          </div>
          <div className="flex gap-3">
            <Package className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Keep product IDs stable. Coupons use product IDs for product-specific discounts.
            </p>
          </div>
          <div className="flex gap-3">
            <Users className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              User-specific coupons use the customer account ID found by email at creation time.
            </p>
          </div>
          <div className="flex gap-3">
            <TicketPercent className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              For reusable public discounts, create a public coupon and choose Reusable until disabled.
            </p>
          </div>
          <div className="flex gap-3">
            <KeyRound className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Never expose service role keys in the frontend. Coupon creation and redemption happen only through the API app.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
