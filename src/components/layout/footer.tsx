import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built with ❤️ for improved learning.
                </p>
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} EduPilot AI. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
