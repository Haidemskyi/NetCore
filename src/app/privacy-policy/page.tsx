import type { Metadata } from 'next';
import PrivacyContent from './privacy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy - NETCORE CRM',
  description: 'Privacy Policy and Data Protection declaration for NETCORE CRM Mobile and Web Application.',
  openGraph: {
    title: 'Privacy Policy - NETCORE CRM',
    description: 'Privacy Policy and Data Protection declaration for NETCORE CRM Mobile and Web Application.',
    url: 'https://crm.qwartz.net/privacy-policy',
    siteName: 'NETCORE CRM',
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyContent />;
}
