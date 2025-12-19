import { Roboto } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'MeowTube - Watch & Share Videos',
  description: 'A modern video platform powered by Telegram',
  keywords: ['videos', 'streaming', 'download', 'upload'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.className}>
        <ThemeProvider>
          <div className="app-layout">
            <Header />
            <div className="main-container">
              <Sidebar />
              <main className="content-area">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
