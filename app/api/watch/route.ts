

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Fake: send file change every 2s
            const interval = setInterval(() => {
                const change = { type: "file-change", event: "update", path: "/some/file.txt" };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(change)}\n\n`));
            }, 2000);

            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}