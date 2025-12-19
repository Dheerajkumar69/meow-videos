'use client';

import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
    const { theme, toggleTheme, toggleSidebar } = useTheme();

    return (
        <header className="header">
            {/* Left Section */}
            <div className="header-start">
                <button
                    className="menu-toggle"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    ☰
                </button>
                <Link href="/" className="logo">
                    <span className="logo-icon">▶</span>
                    <span>MeowTube</span>
                </Link>
            </div>

            {/* Center Section - Search */}
            <div className="header-center">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search videos..."
                        aria-label="Search"
                    />
                    <button className="search-btn" aria-label="Search">
                        🔍
                    </button>
                </div>
            </div>

            {/* Right Section */}
            <div className="header-end">
                <Link href="/upload" className="upload-btn">
                    <span>📤</span>
                    <span>Upload</span>
                </Link>

                <button
                    className="icon-btn theme-toggle"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <button className="icon-btn" aria-label="Notifications">
                    🔔
                </button>

                <button className="avatar" aria-label="Account">
                    U
                </button>
            </div>
        </header>
    );
}
