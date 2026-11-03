import '@fontsource-variable/inter';
import './globals.css';
import { Providers } from './providers';
import Preloader from '../components/preloader';
import type { Viewport } from 'next';

export const metadata = {
  title: 'Brightloop — Subscription Analytics & Workspace',
  description: 'Boost business with subscription analytics, billing, and customer relationships in one beautifully connected workspace.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Big+Shoulders+Display:wght@800;900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('bl_preloaded')==='true'){var s=document.createElement('style');s.id='bl-hide-preloader';s.textContent='#bl-preloader{display:none!important}';document.head.appendChild(s);}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Providers>
          <Preloader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
