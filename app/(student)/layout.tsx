import type { ReactNode } from "react";

import { Navbar } from "@/components/common/Navbar";
import { CartDrawer } from "@/components/student/CartDrawer";
import { ActiveOrderProvider } from "@/app/(student)/ActiveOrderContext";
import { ActiveOrderBanner } from "@/components/student/ActiveOrderBanner";
import { OrderHelpWidget } from "@/components/student/OrderHelpWidget";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ActiveOrderProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <Navbar />
        <CartDrawer />
        <main className="mx-auto w-full max-w-4xl px-4 py-6 pb-16">
          {children}
        </main>
        <ActiveOrderBanner />
        <OrderHelpWidget />
      </div>
    </ActiveOrderProvider>
  );
}
