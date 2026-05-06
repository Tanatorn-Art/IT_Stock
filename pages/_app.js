import '../styles/globals.css'
import HttpLogger from '../components/HttpLogger'

export default function App({ Component, pageProps }) {
  return (
    <>
      <HttpLogger />
      <Component {...pageProps} />
    </>
  )
}
