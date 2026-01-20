import './globals.css'

export const metadata = {
  title: 'ImageCompress Pro - Compresseur d\'images en ligne',
  description: 'Compressez vos images facilement et gratuitement',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
