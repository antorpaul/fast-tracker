import './globals.css';

export const metadata = {
  title: 'Fast Tracker',
  description: 'A simple fasting tracker with Express backend and SQLite storage.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
