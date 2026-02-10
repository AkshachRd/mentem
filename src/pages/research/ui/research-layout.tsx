export function ResearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="flex h-full flex-col items-center justify-center gap-4 py-8 md:py-10">
            {children}
        </section>
    );
}
