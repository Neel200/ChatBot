import "./globals.css";
import type { AppProps } from "next/app";
export default function MyApp({ Component, pageProps }: AppProps){
  return(
    <div className="bg-gray-50 text-gray-900">
      <main className="p-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}