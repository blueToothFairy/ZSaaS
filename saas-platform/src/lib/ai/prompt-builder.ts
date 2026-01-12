/*
  Using CO-STAR method to build prompt
*/
export class PromptBuilder {
  private parts: string[] = [];

  constructor() {}

  // 1. Context (Role)
  withRole(role: string): PromptBuilder {
    if (role)
      this.parts.push(`You are an expert ${role}.`); 
    return this; 
  }

  // 2. Objective (Task)
  withObjective(topic: string, length: number=100): PromptBuilder {
    this.parts.push(`Your task is to write a comprehensive article (about ${length} words) about: "${topic}".`);
    return this;
  }

  // 3. Style
  withStyle(style: string): PromptBuilder {
    if (style)
      this.parts.push(`Please use a ${style} writing style.`);
    return this;
  }

  // 4. Tone
  withTone(tone: string): PromptBuilder {
    if (tone)
      this.parts.push(`Maintain a ${tone} tone throughout the text.`);
    return this; 
  }

  // 5. Audience
  withAudience(audience: string = "beginner"): PromptBuilder {
    if (audience)
      this.parts.push(`Target audience: ${audience}. Explain things clearly for them.`);
    return this; 
  }

  // 6. Response Format
  withResponseFormat(format: string = "markdown"): PromptBuilder {
    if (format)
      this.parts.push(`Output format: Please strictly follow ${format} syntax.`);
    return this; 
  }

  build(): string {
    return this.parts.join("\n\n");
  }
}