import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

import { ForwardLogo, CloseLogo } from '@/shared/ui/icons';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface CardCreationFormProps {
    frontSide: string;
    onCancel: () => void;
    onCreate: (backSide: string) => void;
}

export const CardCreationForm = ({ frontSide, onCancel, onCreate }: CardCreationFormProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [backSide, setBackSide] = useState('');

    return (
        <motion.div
            animate={{ y: 0 }}
            className="relative"
            exit={{ y: '-100%' }}
            initial={{ y: '-100%' }}
            transition={{ type: 'tween' }}
        >
            <div className="relative">
                <Input
                    ref={inputRef}
                    className="rounded-full"
                    placeholder="Back side"
                    value={backSide}
                    onChange={(e) => setBackSide(e.target.value)}
                />
                <motion.div
                    animate={{ x: 0 }}
                    className="start-full-0.5 absolute top-0"
                    exit={{ x: '-100%' }}
                    initial={{ x: '-100%' }}
                    transition={{ type: 'tween', delay: 0.2 }}
                >
                    <Button className="size-8" variant="outline" onClick={() => onCreate(backSide)}>
                        <ForwardLogo />
                    </Button>
                </motion.div>
                <motion.div
                    animate={{ x: 0, y: '-100%' }}
                    className="end-full-0.5 absolute top-0"
                    exit={{ x: '100%', y: 0 }}
                    initial={{ x: '100%', y: 0 }}
                    transition={{ type: 'tween' }}
                >
                    <Button className="size-8" variant="outline" onClick={onCancel}>
                        <CloseLogo />
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
};
