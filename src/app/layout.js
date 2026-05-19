import "./globals.css";

export const metadata = {
  title: "OSOS Arıza - İstasyon ve Arıza Takip Sistemi",
  description: "İstasyon arızaları, ekip yönetimi ve bakım takibi için modern web uygulaması.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="animate-fade-in" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
