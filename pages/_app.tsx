// import '@/styles/globals.css'
// import type { AppProps } from 'next/app'

// export default function App({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />
  
// }


import { ChakraProvider, Theme } from "@chakra-ui/react";
import { AppProps } from "next/app";


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>

      <Component {...pageProps} />

    </ChakraProvider>
  );
}

export default MyApp;