import { EnhancedComponentsShowcase } from '@/components/ui/enhanced-components-showcase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enhanced Components - GoCars Design System',
  description: 'Showcase of enhanced ShadCN components with modern styling and improved UX',
};

export default function ComponentsShowcasePage() {
  return (
    <div className="min-h-screen bg-brand-secondary-50">
      <EnhancedComponentsShowcase />
    </div>
  );
}