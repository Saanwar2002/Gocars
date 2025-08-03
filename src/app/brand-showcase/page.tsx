import { BrandShowcase } from '@/components/brand/BrandShowcase';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Brand Showcase - GoCars Design System',
    description: 'Comprehensive brand guidelines and design system for GoCars',
};

export default function BrandShowcasePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <BrandShowcase />
            </div>
        </div>
    );
}