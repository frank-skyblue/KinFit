import { TokenPayload } from '../services/authenticationService';

export interface AuthRequest {
  body: any;
  query: any;
  params: any;
  headers: any;
  method?: string;
  url?: string;
  user?: TokenPayload;
}
