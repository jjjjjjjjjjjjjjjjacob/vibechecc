export function IconLink({
  icon,
  href,
  label,
}: {
  icon: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="text-muted-foreground text-center text-xs font-bold uppercase"
    >
      <img
        src={icon}
        alt=""
        aria-hidden
        className="inline-block h-8 rounded-full"
      />
      <span className="mt-2 block">{label}</span>
    </a>
  );
}
