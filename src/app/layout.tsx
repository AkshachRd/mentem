import './styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';

import { Toaster } from '../shared/ui/sonner';

import { Providers } from './providers';

import { siteConfig } from '@/shared/config';
import { IBMPlexSans } from '@/shared/config';
import { Navbar } from '@/widgets/navbar';

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: '/favicon.ico',
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

export function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html suppressHydrationWarning lang="en">
            <head />
            <body
                className={clsx(
                    'bg-background min-h-screen font-sans antialiased',
                    IBMPlexSans.variable,
                )}
            >
                <Providers themeProps={{ attribute: 'class', defaultTheme: 'dark' }}>
                    <div className="relative flex h-screen flex-col">
                        <Navbar />
                        <main className="container mx-auto max-w-7xl grow px-6 pt-16">
                            {children}
                        </main>
                    </div>
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
