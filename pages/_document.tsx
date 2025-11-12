import { Html, Head, Main, NextScript } from "next/document";
export default function Document(){
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="A demo app showing routing and data flow"/>
      </Head>
      <body>
        <Main/>
        <NextScript/>
      </body>
    </Html>
  );
}