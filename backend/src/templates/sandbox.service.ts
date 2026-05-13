import { Injectable, BadRequestException } from '@nestjs/common';
import * as vm from 'vm';

@Injectable()
export class SandboxService {
  async runTemplate(code: string, inputs: Record<string, any>): Promise<any> {
    const context = vm.createContext(Object.freeze({ inputs: structuredClone(inputs) }));
    const script = new vm.Script(
      `(function() { var fn = (${code}); return JSON.stringify(fn(inputs)); })()`,
    );
    let raw: string;
    try {
      raw = script.runInContext(context, { timeout: 50 });
    } catch (e: any) {
      throw new BadRequestException(`Template error: ${e.message}`);
    }
    const result = JSON.parse(raw);
    return {
      question: String(result.question ?? ''),
      answer: result.answer,
      hint: result.hint !== undefined ? String(result.hint) : undefined,
      explanation: result.explanation !== undefined ? String(result.explanation) : undefined,
      choices: Array.isArray(result.choices) ? result.choices.map(String) : undefined,
    };
  }

  generateInputs(schema: Record<string, any>): Record<string, any> {
    const inputs: Record<string, any> = {};
    for (const [key, field] of Object.entries(schema)) {
      if (field.type === 'int') {
        const min = field.min ?? 1;
        const max = field.max ?? 100;
        inputs[key] = Math.floor(Math.random() * (max - min + 1)) + min;
      } else if (field.type === 'float') {
        const min = field.min ?? 0;
        const max = field.max ?? 1;
        inputs[key] = Math.random() * (max - min) + min;
      } else if (field.type === 'string' && Array.isArray(field.values)) {
        inputs[key] = field.values[Math.floor(Math.random() * field.values.length)];
      }
    }
    return inputs;
  }
}
