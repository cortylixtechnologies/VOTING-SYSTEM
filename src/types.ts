export interface User {
  id: number;
  studentId: string;
  email: string;
  role: 'student' | 'admin';
}

export interface Candidate {
  id: number;
  position_id: number;
  name: string;
  bio: string;
  image_url: string;
}

export interface Position {
  id: number;
  election_id: number;
  title: string;
  candidates: Candidate[];
}

export interface Election {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed';
  positions?: Position[];
}

export interface VoteResult {
  position: string;
  candidate: string;
  votes: number;
}
