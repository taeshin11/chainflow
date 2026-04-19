import AdminLogsPage from '@/components/pages/AdminLogsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · Logs · Flowvium',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLogsPage />;
}
