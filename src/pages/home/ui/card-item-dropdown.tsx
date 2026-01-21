import { useHover } from 'react-aria';
import { useState } from 'react';

import {
    AddNoteIcon,
    CopyDocumentIcon,
    EditDocumentIcon,
    DeleteDocumentIcon,
} from '@/shared/ui/icons';
import { debounce } from '@/shared/lib/debounce';
import { Card, CardComponent } from '@/entities/card';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/shared/ui/dropdown-menu';

interface CardItemDropdownProps {
    card: Card;
    onModalOpen: () => void;
}

const iconClasses = 'text-xl text-default-500 pointer-events-none shrink-0';

export function CardItemDropdown({ card, onModalOpen }: CardItemDropdownProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { hoverProps: cardHoverProps, isHovered: isCardHovered } = useHover({
        onHoverStart: () => setIsDropdownOpen(true),
        onHoverEnd: debounce(() => setIsDropdownOpen(false), 300),
    });
    const { hoverProps: menuHoverProps, isHovered: isMenuHovered } = useHover({});

    return (
        <DropdownMenu open={isDropdownOpen || isMenuHovered}>
            <DropdownMenuTrigger>
                <div
                    className="w-full"
                    {...cardHoverProps}
                    onClick={() => {
                        setIsDropdownOpen(false);
                        onModalOpen();
                    }}
                >
                    <CardComponent
                        footerContent={card.backSide}
                        headerContent={card.frontSide}
                        revealBack={isCardHovered}
                    />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                {...menuHoverProps}
                aria-label="Dropdown menu with description"
                className="w-full min-w-0"
                side="right"
            >
                <DropdownMenuItem className="justify-between gap-x-0">
                    <span>Add Note</span>
                    <AddNoteIcon className={iconClasses} />
                </DropdownMenuItem>
                <DropdownMenuItem className="justify-between gap-x-0">
                    <span>Copy</span>
                    <CopyDocumentIcon className={iconClasses} />
                </DropdownMenuItem>
                <DropdownMenuItem className="justify-between gap-x-0">
                    <span>Edit</span>
                    <EditDocumentIcon className={iconClasses} />
                </DropdownMenuItem>
                <DropdownMenuItem className="justify-between gap-x-0" variant="destructive">
                    <span>Delete</span>
                    <DeleteDocumentIcon className={iconClasses} />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
