'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
    const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useTheme();
    const pathname = usePathname();

    const mainNav = [
        { icon: '🏠', label: 'Home', href: '/' },
        { icon: '🔥', label: 'Trending', href: '/?filter=trending' },
        { icon: '📤', label: 'Upload', href: '/upload' },
    ];

    const categories = [
        { icon: '🎵', label: 'Music', href: '/?category=music' },
        { icon: '🎮', label: 'Gaming', href: '/?category=gaming' },
        { icon: '📚', label: 'Education', href: '/?category=education' },
        { icon: '🎬', label: 'Entertainment', href: '/?category=entertainment' },
        { icon: '🏋️', label: 'Sports', href: '/?category=sports' },
        { icon: '📰', label: 'News', href: '/?category=news' },
    ];

    const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

    return (
        <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay mobile-only"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 899,
                    }}
                />
            )}

            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
                {/* Main Navigation */}
                <nav className="sidebar-section">
                    {mainNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-text">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Categories */}
                <div className="sidebar-section">
                    <div className="section-title">Categories</div>
                    {categories.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="nav-item"
                            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-text">{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Library */}
                <div className="sidebar-section">
                    <div className="section-title">Library</div>
                    <Link href="/?filter=history" className="nav-item">
                        <span className="nav-icon">📜</span>
                        <span className="nav-text">History</span>
                    </Link>
                    <Link href="/?filter=liked" className="nav-item">
                        <span className="nav-icon">👍</span>
                        <span className="nav-text">Liked Videos</span>
                    </Link>
                    <Link href="/?filter=downloads" className="nav-item">
                        <span className="nav-icon">⬇️</span>
                        <span className="nav-text">Downloads</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
