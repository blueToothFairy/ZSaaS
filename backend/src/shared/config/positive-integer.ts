export const positiveInteger = (name: string, fallback: number): number => {
  const configured = process.env[name];
  if (configured === undefined || configured.trim() === '') return fallback;
  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
};
