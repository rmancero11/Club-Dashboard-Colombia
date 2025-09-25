import { ReactNode } from 'react';
import Sidebar from '@/app/components/layout/Sidebar';
import Footer from '@/app/components/Footer';
import { BusinessProvider } from '@/app/context/BusinessContext';
import RefreshButton from '../components/ui/RefreshButton';
import GoogleReviewsButton from '../components/GoogleReviewsButton';
import FeedbackButton from '../components/FeedbackButton';

interface ILayoutProps {
  children: ReactNode;
}

function Layout({ children }: ILayoutProps) {
  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 relative">
        <main className="container mx-auto md:mt-10 mb-28">
          <RefreshButton />
          <GoogleReviewsButton />
          <FeedbackButton />
          <BusinessProvider>{children}</BusinessProvider>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
