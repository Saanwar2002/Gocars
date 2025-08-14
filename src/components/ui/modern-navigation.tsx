'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Home,
  Menu,
  X,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Bookmark,
  History,
  Star,
  ExternalLink
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  };
  children?: NavigationItem[];
  external?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface ModernNavigationProps {
  items: NavigationItem[];
  breadcrumbs?: BreadcrumbItem[];
  showBreadcrumbs?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  logo?: React.ReactNode;
  userAvatar?: React.ReactNode;
  userName?: string;
  notificationCount?: number;
  searchPlaceholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
  onLogout?: () => void;
}

export function ModernNavigation({
  items,
  breadcrumbs,
  showBreadcrumbs = true,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  logo,
  userAvatar,
  userName,
  notificationCount = 0,
  searchPlaceholder = 'Search...',
  className,
  onSearch,
  onNotificationClick,
  onUserMenuClick,
  onLogout,
}: ModernNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const autoBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs) return breadcrumbs;

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      crumbs.push({
        label,
        href: index === segments.length - 1 ? undefined : currentPath,
      });
    });

    return crumbs;
  }, [breadcrumbs, pathname]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const isActiveItem = (item: NavigationItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => isActiveItem(child));
    }
    return false;
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = isActiveItem(item);
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const itemContent = (
      <div
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          level > 0 && 'ml-4',
          isActive
            ? 'bg-brand-primary-100 text-brand-primary-700 shadow-sm'
            : 'text-brand-secondary-700 hover:bg-brand-secondary-100 hover:text-brand-secondary-900',
          item.disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center space-x-3">
          {item.icon && (
            <span className={cn(
              'transition-colors duration-200',
              isActive ? 'text-brand-primary-600' : 'text-brand-secondary-500'
            )}>
              {item.icon}
            </span>
          )}
          <span className="truncate">{item.label}</span>
          {item.external && (
            <ExternalLink className="h-3 w-3 opacity-50" />
          )}
        </div>

        <div className="flex items-center space-x-2">
          {item.badge && (
            <Badge
              variant={item.badge.variant || 'default'}
              size="xs"
            >
              {item.badge.text}
            </Badge>
          )}
          {hasChildren && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </div>
      </div>
    );

    return (
      <div key={item.id} className="space-y-1">
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'block',
              item.disabled && 'pointer-events-none'
            )}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
          >
            {itemContent}
          </Link>
        ) : (
          <button
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              }
              item.onClick?.();
            }}
            className="w-full text-left"
            disabled={item.disabled}
          >
            {itemContent}
          </button>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 animate-fade-in-down">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={cn('bg-white border-b border-brand-secondary-200 shadow-sm', className)}>
      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Logo */}
            {logo && (
              <Link href="/" className="flex items-center">
                {logo}
              </Link>
            )}

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-2">
              {items.slice(0, 5).map(item => renderNavigationItem(item))}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-secondary-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 text-sm border border-brand-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 transition-colors duration-200"
                  />
                </div>
              </form>
            )}

            {/* Notifications */}
            {showNotifications && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative"
                onClick={onNotificationClick}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    size="xs"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            {showUserMenu && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2"
                >
                  {userAvatar || (
                    <div className="h-8 w-8 bg-brand-primary-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {userName && (
                    <span className="hidden sm:block text-sm font-medium">
                      {userName}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 top-12 bg-white border border-brand-secondary-200 rounded-lg shadow-brand-lg z-50 min-w-[200px] animate-fade-in-down">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-brand-secondary-100">
                        <p className="text-sm font-medium text-brand-secondary-900">
                          {userName || 'User'}
                        </p>
                        <p className="text-xs text-brand-secondary-500">
                          user@example.com
                        </p>
                      </div>
                      
                      <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200">
                        <Bookmark className="h-4 w-4" />
                        <span>Bookmarks</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-brand-secondary-50 transition-colors duration-200">
                        <History className="h-4 w-4" />
                        <span>History</span>
                      </button>
                      
                      <div className="border-t border-brand-secondary-100 mt-2 pt-2">
                        <button
                          onClick={onLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-error-50 text-error-600 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {showBreadcrumbs && autoBreadcrumbs.length > 1 && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-t border-brand-secondary-100 bg-brand-secondary-50">
          <nav className="flex items-center space-x-2 text-sm">
            {autoBreadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-brand-secondary-400" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="flex items-center space-x-1 text-brand-primary-600 hover:text-brand-primary-700 transition-colors duration-200"
                  >
                    {crumb.icon}
                    <span>{crumb.label}</span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-1 text-brand-secondary-600">
                    {crumb.icon}
                    <span>{crumb.label}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-brand-secondary-200 bg-white animate-fade-in-down">
          <div className="px-4 py-4 space-y-2">
            {items.map(item => renderNavigationItem(item))}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showUserDropdown || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserDropdown(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
}

// Breadcrumb component for standalone use
export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-brand-secondary-400" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center space-x-1 text-brand-primary-600 hover:text-brand-primary-700 transition-colors duration-200"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-1 text-brand-secondary-600">
              {item.icon}
              <span>{item.label}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}