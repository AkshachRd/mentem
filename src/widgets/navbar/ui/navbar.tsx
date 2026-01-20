'use client';

import Link from 'next/link';
import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { useDisclosure } from '@heroui/react';

import { siteConfig } from '@/shared/config';
import { ThemeSwitch } from '@/shared/ui/theme-switch';
import { SettingsTab } from '@/pages/home/ui/settings-tab';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuTriggerStyle,
} from '@/shared/ui/navigation-menu';
import { Button } from '@/shared/ui/button';

export const Navbar = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <NavigationMenu>
                    <NavigationMenuList>
                        {siteConfig.navItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <Link legacyBehavior passHref href={item.href}>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        {item.label}
                                    </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <ThemeSwitch />
                    <Button size="sm" variant="ghost" onClick={onOpen}>
                        settings
                    </Button>
                </div>
            </div>

            <Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader>settings</ModalHeader>
                            <ModalBody>
                                <SettingsTab />
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </header>
    );
};
