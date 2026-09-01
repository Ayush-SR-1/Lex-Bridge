import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  description: z.string().min(20).max(4000),
});

export type TriageResult = {
  practice_area: string;
  urgency: "Low" | "Medium" | "High";
  summary: string;
  next_steps: string[];
  documents: string[];
  questions: string[];
  limitation_note: string;
};

const SYSTEM = `You are a legal intake triage assistant for an Indian legal marketplace called LexBridge.
You do NOT give legal advice. You classify and organise a matter so a human advocate can act fast.
Respond ONLY with compact JSON matching:
{"practice_area": one of ["Corporate","Family","Tax","IP","Criminal","Property","Labour","Consumer","Constitutional"],
 "urgency": "Low"|"Medium"|"High",
 "summary": "2-3 sentence neutral summary of the matter",
 "next_steps": ["3-5 short procedural steps"],
 "documents": ["3-6 documents the client should gather"],
 "questions": ["3-4 questions counsel will ask"],
 "limitation_note": "one sentence on timing/limitation urgency"}`;

export const triageMatter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<TriageResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.description },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Triage is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Triage failed (${res.status}).`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Partial<TriageResult>;

    return {
      practice_area: parsed.practice_area ?? "Corporate",
      urgency: (parsed.urgency as TriageResult["urgency"]) ?? "Medium",
      summary: parsed.summary ?? "",
      next_steps: parsed.next_steps ?? [],
      documents: parsed.documents ?? [],
      questions: parsed.questions ?? [],
      limitation_note: parsed.limitation_note ?? "",
    };
  });
