import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight03Icon, ClipboardIcon } from '@hugeicons/core-free-icons';

import { Button } from '@/shared/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

export function StudyCard() {
    return (
        <Card className="relative mx-auto w-full max-w-sm pt-0" size="default">
            <div className="bg-primary absolute inset-0 z-30 aspect-video opacity-50 mix-blend-color" />
            {/* <img
                alt="Photo by mymind on Unsplash"
                className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale"
                src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                title="Photo by mymind on Unsplash"
            /> */}

            <HugeiconsIcon
                className="self-center p-4"
                data-icon="inline-start"
                icon={ClipboardIcon}
                size="10rem"
                strokeWidth={2}
            />
            <CardHeader>
                <CardTitle>Study List</CardTitle>
                <CardDescription>
                    Add your favorite books to your study list and start studying them today.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className="w-full">
                    Go to Study List
                    <HugeiconsIcon
                        data-icon="inline-start"
                        icon={ArrowUpRight03Icon}
                        strokeWidth={2}
                    />
                </Button>
            </CardFooter>
        </Card>
    );
}
