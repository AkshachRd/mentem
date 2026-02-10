'use client';

import { FC } from 'react';
import { useTheme } from 'next-themes';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun03Icon, Moon02Icon } from '@hugeicons/core-free-icons';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface ThemeSwitchProps {
    className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Button
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className={cn('transition-opacity hover:opacity-80', className)}
            size="icon-sm"
            variant="ghost"
            onClick={toggleTheme}
        >
            <HugeiconsIcon
                className="size-[22px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
                icon={Sun03Icon}
                strokeWidth={2}
            />
            <HugeiconsIcon
                className="absolute size-[22px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
                icon={Moon02Icon}
                strokeWidth={2}
            />
        </Button>
    );
};
