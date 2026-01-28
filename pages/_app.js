import Layout from '../components/Layout';
import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../redux/store';
import SEO from '../next-seo.config';
import { DefaultSeo } from 'next-seo';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <div className="appWrapper">
            <div className="appContainer">
              <Layout>
                <DefaultSeo {...SEO} />

                <Component {...pageProps} />
              </Layout>
            </div>
          </div>
        </PersistGate>
      </Provider>
    </SessionProvider>
  );
}
