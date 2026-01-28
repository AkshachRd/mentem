'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useGenerateFlashcard } from '../model/use-generate-flashcard';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { useCardStore } from '@/entities/card';

interface CreateFlashcardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedText: string;
    sourceContext?: string;
}

export function CreateFlashcardDialog({
    open,
    onOpenChange,
    selectedText,
    sourceContext,
}: CreateFlashcardDialogProps) {
    const [frontSide, setFrontSide] = useState('');
    const [backSide, setBackSide] = useState('');

    const { object, isLoading, generate, stop } = useGenerateFlashcard();
    const addCard = useCardStore((state) => state.addCard);

    // Update form when AI generates content
    useEffect(() => {
        if (object?.frontSide) {
            setFrontSide(object.frontSide);
        }
        if (object?.backSide) {
            setBackSide(object.backSide);
        }
    }, [object?.frontSide, object?.backSide]);

    // Reset form when dialog opens with new text
    useEffect(() => {
        if (open) {
            setFrontSide('');
            setBackSide('');
        }
    }, [open, selectedText]);

    const handleGenerateWithAI = useCallback(() => {
        generate(selectedText, sourceContext);
    }, [generate, selectedText, sourceContext]);

    const handleSave = useCallback(() => {
        if (!frontSide.trim() || !backSide.trim()) return;

        addCard({
            frontSide: frontSide.trim(),
            backSide: backSide.trim(),
        });
        toast.success('Карточка создана');
        onOpenChange(false);
    }, [frontSide, backSide, addCard, onOpenChange]);

    const handleClose = useCallback(() => {
        if (isLoading) {
            stop();
        }
        onOpenChange(false);
    }, [isLoading, stop, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Создать карточку</DialogTitle>
                    <DialogDescription>
                        Создайте флеш-карточку из выделенного текста. Используйте AI для
                        автоматической генерации вопроса и ответа.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Selected text preview */}
                    <div className="bg-muted/50 rounded-md p-3">
                        <Label className="text-muted-foreground mb-1 text-xs">
                            Выделенный текст
                        </Label>
                        <p className="line-clamp-3 text-xs">{selectedText}</p>
                    </div>

                    {/* AI Generate button */}
                    <Button
                        className="w-full"
                        disabled={isLoading || !selectedText}
                        variant="outline"
                        onClick={handleGenerateWithAI}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Генерация...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Сгенерировать с AI
                            </>
                        )}
                    </Button>

                    {/* Front side input */}
                    <div className="space-y-2">
                        <Label htmlFor="frontSide">Вопрос (лицевая сторона)</Label>
                        <Textarea
                            id="frontSide"
                            placeholder="Введите вопрос..."
                            value={frontSide}
                            onChange={(e) => setFrontSide(e.target.value)}
                        />
                    </div>

                    {/* Back side input */}
                    <div className="space-y-2">
                        <Label htmlFor="backSide">Ответ (обратная сторона)</Label>
                        <Textarea
                            id="backSide"
                            placeholder="Введите ответ..."
                            value={backSide}
                            onChange={(e) => setBackSide(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Отмена
                    </Button>
                    <Button
                        disabled={!frontSide.trim() || !backSide.trim() || isLoading}
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
