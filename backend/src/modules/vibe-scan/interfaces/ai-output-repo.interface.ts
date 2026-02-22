import {
  AIOutputDTO,
  CreateAIOutputDTO
} from '../dto/ai-repo.js';

export default interface AIRepositoty {
  create(data: CreateAIOutputDTO) : Promise<AIOutputDTO>;
  findByUserId(user_id: string, limit: number, offset: number) : Promise<AIOutputDTO[]>;
}