import './globals.css';

export const metadata = {
  title: 'Fast Tracker',
  description: 'A simple fasting tracker with Express backend and SQLite storage.',
  manifest: '/manifest.json',
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>{children}</body>
    </html>
  );
}
