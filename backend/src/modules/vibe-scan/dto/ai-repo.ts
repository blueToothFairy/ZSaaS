// Định nghĩa chuẩn cho ENUM ai_feature_type
export type AIFeatureType = 
  | 'article_gen' 
  | 'blog_title' 
  | 'image_gen' 
  | 'bg_remove' 
  | 'object_remove' 
  | 'resume_analyze'
  | 'match_music';

// Định nghĩa cho Status
export type AIOutputStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type JSONB = Record<string, any>;

export interface AIOutputDTO {
  id: string;                  
  user_id: string;             
  feature_type: AIFeatureType; 
  input_params: JSONB;         
  output_data: JSONB;          
  status: AIOutputStatus;      
  created_at: Date;            
  updated_at: Date;
  idempotency_key?: string | null;
  stage?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}

export interface CreateAIOutputDTO {
  user_id: string;
  feature_type: AIFeatureType;
  
  input_params?: JSONB; 
  output_data?: JSONB;
  status?: AIOutputStatus; 
  idempotency_key?: string | null;
}

export interface UpdateAIOutputDTO {
  input_params?: JSONB;
  output_data?: JSONB;
  status?: AIOutputStatus;
  stage?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}
