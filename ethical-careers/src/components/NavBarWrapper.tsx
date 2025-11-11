"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide Navbar on these pages:
  const hideNavOn = ["/thank-you"];
  const shouldHideNav = hideNavOn.includes(pathname);

  return (
    <>
      {!shouldHideNav && <Navbar />}
      {children}
    </>
  );
}
