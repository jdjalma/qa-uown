import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'src', 'fixtures', 'api-templates');

export function loadTemplate(templateName: string): string {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`API template not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+(?:\.\w+)*)}/g, (match, key) => {
    const value = vars[key];
    if (value === undefined) {
      console.warn(`Template variable not found: ${key}`);
      return match;
    }
    return value;
  });
}

export function buildRequestBody(templateName: string, vars: Record<string, string>): object {
  const raw = loadTemplate(templateName);
  const interpolated = interpolateTemplate(raw, vars);
  return JSON.parse(interpolated);
}
