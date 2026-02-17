import { Outfit } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthContext from '@/context/AuthContext';
import { DialogProvider } from '@/context/DialogContext';
import WhatsAppSupport from '@/components/common/WhatsAppSupport';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <AuthContext>
          <ThemeProvider>
            <DialogProvider>
              <SidebarProvider>{children}</SidebarProvider>
              <WhatsAppSupport />
            </DialogProvider>
          </ThemeProvider>
        </AuthContext>
      </body>
    </html>
  );
}
