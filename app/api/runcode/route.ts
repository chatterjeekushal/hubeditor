
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { code, language = "javascript" } = await req.json();

        if (!code) {
            return NextResponse.json(
                { output: "❌ No code provided" },
                { status: 400 }
            );
        }

        // Map language names to Piston API compatible names
        const languageMap: Record<string, string> = {
            'javascript': 'javascript',
            'python': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'ruby': 'ruby',
            'go': 'go',
            'rust': 'rust',
            'php': 'php',
            'typescript': 'typescript',
            'csharp': 'csharp'
        };

        const pistonLanguage = languageMap[language.toLowerCase()] || 'javascript';

        // Use Piston API (free and no setup required)
        const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: pistonLanguage,
                version: '*', // Latest version
                files: [{ content: code }],
                stdin: '',
                args: []
            })
        });

        if (!pistonResponse.ok) {
            throw new Error(`Piston API error: ${pistonResponse.status}`);
        }

        const result = await pistonResponse.json();

        let output = '';
        if (result.compile && result.compile.output) {
            output += `🔧 Compilation:\n${result.compile.output}\n\n`;
        }
        if (result.run.output) {
            output += `📤 Output:\n${result.run.output}\n`;
        }
        if (result.run.stderr) {
            output += `❌ Error:\n${result.run.stderr}\n`;
        }
        if (result.run.signal) {
            output += `⚡ Signal: ${result.run.signal}\n`;
        }

        return NextResponse.json({
            output: output.trim() || "✅ Execution completed (no output)",
            language: pistonLanguage
        });

    } catch (err: any) {
        console.error("Execution error:", err);
        return NextResponse.json({
            output: `❌ Server Error:\n${err.message}`
        }, { status: 500 });
    }
}