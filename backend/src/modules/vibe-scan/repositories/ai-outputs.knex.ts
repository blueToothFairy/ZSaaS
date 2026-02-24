import AIRepositoty from '../interfaces/ai-output-repo.interface.js';
import { Knex } from 'knex';

import { CreateAIOutputDTO, AIOutputDTO } from '../dto/ai-repo.js';

export default class KnexAIOutputsRepository implements AIRepositoty {
  private readonly TABLE_NAME="ai_outputs";
  constructor (
    private readonly knexClient: Knex
  ) {}

  async create(data: CreateAIOutputDTO): Promise<AIOutputDTO> {
    try {
      const [insertedRecord] = await this.knexClient(this.TABLE_NAME)
        .insert(data)
        .returning('*');

      return insertedRecord as AIOutputDTO;
    } catch (error) {
      console.error('Error creating AI Output:', error);
      throw new Error('Could not create AI Output record in database.');
    }
  }

  async findByUserId(user_id: string, limit: number, offset: number): Promise<AIOutputDTO[]> {
    try {
      const records = await this.knexClient(this.TABLE_NAME)
        .where({ user_id })
        .orderBy('created_at', 'desc') 
        .limit(limit)
        .offset(offset);

      return records as AIOutputDTO[];
    } catch (error) {
      console.error(`Error fetching AI Outputs for user:`, error);
      throw new Error('Could not fetch AI Output records from database.');
    }
  }
}