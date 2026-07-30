/**
 * Sign-in, registration and password reset are the shop's only full-bleed
 * screens: a campaign image on one side, one decision on the other. They carry
 * their own mark, their own way back to the shop and their own language switch,
 * so the site's header and footer are deliberately absent — a nav bar full of
 * other decisions is the wrong company for this one.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
