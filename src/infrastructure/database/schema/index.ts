import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  primaryKey,
  char,
  text,
} from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "in_progress",
  "finished",
]);

export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogUserRoles = pgTable("catalog_user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => catalogUserRoles.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  })
);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  inviteCode: varchar("invite_code", { length: 10 }).notNull().unique(),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  maxMembers: integer("max_members").default(20).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.groupId, t.userId] }),
  })
);

export const scoringRuleTypes = pgTable("scoring_rule_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  defaultPoints: integer("default_points").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupScoringConfig = pgTable(
  "group_scoring_config",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    ruleTypeId: uuid("rule_type_id")
      .notNull()
      .references(() => scoringRuleTypes.id, { onDelete: "cascade" }),
    points: integer("points").notNull().default(1),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.groupId, t.ruleTypeId] }),
  })
);

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchNumber: integer("match_number").notNull().unique(),
  groupName: char("group_name", { length: 1 }).notNull(),
  stage: varchar("stage", { length: 50 }).notNull().default("group"),
  teamHome: varchar("team_home", { length: 50 }).notNull(),
  teamHomeIso2: varchar("team_home_iso2", { length: 10 }),
  teamHomeNameEn: varchar("team_home_name_en", { length: 50 }),
  teamHomeFlagUrl: varchar("team_home_flag_url", { length: 255 }),
  teamAway: varchar("team_away", { length: 50 }).notNull(),
  teamAwayIso2: varchar("team_away_iso2", { length: 10 }),
  teamAwayNameEn: varchar("team_away_name_en", { length: 50 }),
  teamAwayFlagUrl: varchar("team_away_flag_url", { length: 255 }),
  matchDate: timestamp("match_date").notNull(),
  venue: varchar("venue", { length: 100 }),
  city: varchar("city", { length: 100 }),
  countryHost: varchar("country_host", { length: 100 }),
  scoreHome: integer("score_home"),
  scoreAway: integer("score_away"),
  status: matchStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    predictionHome: integer("prediction_home").notNull(),
    predictionAway: integer("prediction_away").notNull(),
    pointsEarned: integer("points_earned").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userMatchGroupUnique: "unique_user_match_group",
  })
);
