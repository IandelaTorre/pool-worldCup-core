export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  maxMembers: number;
  createdAt: Date;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface GroupWithRelations extends Group {
  createdBy?: {
    id: string;
    username: string;
    email: string;
    fullName: string;
  } | null;
  members?: GroupMember[];
  scoringConfig?: ScoringConfig[];
}

export interface ScoringRuleType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultPoints: number;
  createdAt: Date;
}

export interface ScoringConfig {
  groupId: string;
  ruleTypeId: string;
  points: number;
  enabled: boolean;
  ruleType?: ScoringRuleType;
}
