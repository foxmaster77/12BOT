import type { AppProps } from 'next/app';
import '../components/Orchestra.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
