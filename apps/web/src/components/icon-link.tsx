/**
 * Small utility component for a labeled icon hyperlink.
 * Displays an image above a text label and links to an external URL.
 */
export function IconLink({
  icon,
  href,
  label,
}: {
  icon: string; // path to the icon image
  href: string; // destination URL
  label: string; // text shown under the icon
}) {
  return (
    // Anchor element wraps icon and label
    <a href={href} className="text-center text-xs font-bold text-slate-500">
      {/* Icon image displayed above the label */}
      <img
        src={icon}
        alt="" // decorative icon, so empty alt
        aria-hidden
        className="inline-block h-8 rounded-full"
      />
      {/* Text label describing the link */}
      <span className="mt-2 block">{label}</span>
    </a>
  );
}
