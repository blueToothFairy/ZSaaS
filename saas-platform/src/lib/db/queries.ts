import { db } from '@/lib/db/index';

export function saveOutput(entry: {
  user_id: string;
  feature_type: string;
  input_params: object;
  output_data: object;
}) {
  return db('ai_outputs').insert(entry);
}