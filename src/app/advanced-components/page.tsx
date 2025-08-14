import { AdvancedComponentsShowcase } from '@/components/ui/advanced-components-showcase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advanced Components - GoCars Design System',
  description: 'Interactive widgets, charts, modals, and navigation components with real-time features',
};

export default function AdvancedComponentsPage() {
  return (
    <div className="min-h-screen bg-brand-secondary-50">
      <AdvancedComponentsShowcase />
    </div>
  );
}