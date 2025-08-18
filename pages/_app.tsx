// /pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  // Sin Layout global => no hay barra lateral duplicada
  return <Component {...pageProps} />
}
