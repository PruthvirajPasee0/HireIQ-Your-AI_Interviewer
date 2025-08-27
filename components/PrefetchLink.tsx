"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useRef } from "react";

type PrefetchLinkProps = PropsWithChildren<{
  href: string;
  className?: string;
  prefetch?: boolean;
  role?: string;
}> & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export default function PrefetchLink({ href, className, children, prefetch = true, ...rest }: PrefetchLinkProps) {
  const router = useRouter();
  const aRef = useRef<HTMLAnchorElement | null>(null);
  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (!aRef.current || prefetchedRef.current === true) return;
    const el = aRef.current;
    const controller = new AbortController();

    // Prefetch when the link enters the viewport
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !prefetchedRef.current) {
          prefetchedRef.current = true;
          router.prefetch(href);
          io.disconnect();
          break;
        }
      }
    });
    io.observe(el);

    return () => {
      controller.abort();
      io.disconnect();
    };
  }, [href, router]);

  const handlePrefetch = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch(href);
  };

  return (
    <Link
      ref={aRef}
      href={href}
      prefetch={prefetch}
      className={className}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      {...rest}
    >
      {children}
    </Link>
  );
}
