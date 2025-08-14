import { ResponsiveShowcase } from '@/components/ui/responsive-showcase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Responsive Design - GoCars Design System',
  description: 'Comprehensive responsive design system with mobile, tablet, and desktop optimizations',
};

export default function ResponsiveShowcasePage() {
  return (
    <div className="min-h-screen bg-brand-secondary-50">
      <ResponsiveShowcase />
    </div>
  );
}