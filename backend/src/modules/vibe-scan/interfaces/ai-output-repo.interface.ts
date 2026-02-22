import {
  AIOutputDTO,
  CreateAIOutputDTO
} from '../dto/ai-repo';

export default interface AIRepositoty {
  create(data: CreateAIOutputDTO) : Promise<AIOutputDTO>;
  findByUserId(user_id: string, limit: number, offset: number) : Promise<AIOutputDTO[]>;
}