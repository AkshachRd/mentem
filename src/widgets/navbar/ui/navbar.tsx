'use client';

import {
    Navbar as NextUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarItem,
    NavbarMenuItem,
    NavbarMenuToggle,
} from '@heroui/navbar';
import { Button } from '@heroui/react';
import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { useDisclosure } from '@heroui/react';
import { Link } from '@heroui/link';

import { siteConfig } from '@/shared/config';
import { ThemeSwitch } from '@/shared/ui/theme-switch';
import { SettingsTab } from '@/pages/home/ui/settings-tab';

export const Navbar = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (
        <NextUINavbar maxWidth="xl" position="sticky">
            <NavbarContent className="hidden basis-1/5 sm:flex sm:basis-full" justify="start">
                <ul className="ml-2 hidden justify-start gap-4 sm:flex">
                    {siteConfig.navItems.map((item) => (
                        <NavbarItem key={item.href}>
                            <Link color="foreground" href={item.href} size="md" underline="always">
                                {item.label}
                            </Link>
                        </NavbarItem>
                    ))}
                </ul>
            </NavbarContent>

            <NavbarContent className="hidden basis-1/5 sm:flex sm:basis-full" justify="end">
                <NavbarItem className="hidden gap-2 sm:flex">
                    <ThemeSwitch />
                    <Button size="sm" variant="light" onPress={onOpen}>
                        settings
                    </Button>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent className="basis-1 pl-4 sm:hidden" justify="start">
                <NavbarMenuToggle />
            </NavbarContent>

            <NavbarContent className="basis-1 pl-4 sm:hidden" justify="end">
                <ThemeSwitch />
                <Button size="sm" variant="light" onPress={onOpen}>
                    settings
                </Button>
            </NavbarContent>

            <NavbarMenu>
                <div className="mx-4 mt-2 flex flex-col gap-2">
                    {siteConfig.navMenuItems.map((item, index) => (
                        <NavbarMenuItem key={`${item}-${index}`}>
                            <Link
                                color={
                                    index === siteConfig.navMenuItems.length - 1
                                        ? 'danger'
                                        : 'foreground'
                                }
                                href="#"
                                size="lg"
                                underline="always"
                            >
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                </div>
            </NavbarMenu>
            <Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader>settings</ModalHeader>
                            <ModalBody>
                                <SettingsTab />
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </NextUINavbar>
    );
};
