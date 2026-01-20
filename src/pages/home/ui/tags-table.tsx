import { TagComponent, useTagsStore } from '@/entities/tag';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function TagsTable() {
    const { tags } = useTagsStore();

    return (
        <Table className="w-auto">
            <TableHeader>
                <TableRow>
                    <TableHead>TAG</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tags.map((tag) => (
                    <TableRow key={tag.id}>
                        <TableCell>
                            <TagComponent color={tag.color}>{tag.name}</TagComponent>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
