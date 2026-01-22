'use client';

import { useState } from 'react';

import { siteConfig } from '@/shared/config';
import { ThemeSwitch } from '@/shared/ui/theme-switch';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuTriggerStyle,
} from '@/shared/ui/navigation-menu';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { SettingsTab } from '@/pages/home/ui/settings-tab';

export const Navbar = () => {
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <NavigationMenu>
                    <NavigationMenuList>
                        {siteConfig.navItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <NavigationMenuLink
                                    className={navigationMenuTriggerStyle()}
                                    href={item.href}
                                >
                                    {item.label}
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <ThemeSwitch />
                    <Button size="sm" variant="ghost" onClick={() => setSettingsDialogOpen(true)}>
                        settings
                    </Button>
                </div>
            </div>
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <SettingsTab />
                </DialogContent>
            </Dialog>
        </header>
    );
};
