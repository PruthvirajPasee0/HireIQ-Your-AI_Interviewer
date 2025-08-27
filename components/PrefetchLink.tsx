"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

type PrefetchLinkProps = PropsWithChildren<{
  href: string;
  className?: string;
  prefetch?: boolean;
  role?: string;
}> & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export default function PrefetchLink({ href, className, children, prefetch = true, ...rest }: PrefetchLinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      {...rest}
    >
      {children}
    </Link>
  );
}
