import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import FloatingCartButton from "./components/FloatingCartButton";
import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton";
import HashRouter from "./components/HashRouter";
import { CartProvider } from "./context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sivakasi Mart Traders",
  description: "Quality crackers and fireworks supplier",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col dark-bg-section`}
      >
        <CartProvider>
          <HashRouter>
            {children}
            <CartModal />
            <FloatingWhatsAppButton />
            <FloatingCartButton />
          </HashRouter>
        </CartProvider>
      </body>
    </html>
  );
}
