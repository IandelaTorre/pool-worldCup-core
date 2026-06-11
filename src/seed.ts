import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./infrastructure/database/connection.js";
import {
  users,
  catalogUserRoles,
  userRoles,
  groups,
  groupMembers,
  scoringRuleTypes,
  groupScoringConfig,
  matches,
} from "./infrastructure/database/schema/index.js";

dotenv.config();

async function seed() {
  console.log(" Seeding database...\n");

  const [existingRole] = await db
    .select()
    .from(catalogUserRoles)
    .limit(1);

  if (!existingRole) {
    console.log("  Inserting roles...");
    await db.insert(catalogUserRoles).values([
      { name: "admin", description: "System administrator with full access" },
      { name: "player", description: "Regular player who can make predictions" },
    ]);
    console.log("   Roles inserted: admin, player\n");
  }

  const [existingRuleType] = await db
    .select()
    .from(scoringRuleTypes)
    .limit(1);

  if (!existingRuleType) {
    console.log("  Inserting scoring rule types...");
    await db.insert(scoringRuleTypes).values([
      { code: "exact_score", name: "Exact Score", description: "Correctly predict the exact final score", defaultPoints: 3 },
      { code: "winner", name: "Winner/Draw", description: "Correctly predict which team wins or if its a draw", defaultPoints: 1 },
      { code: "goal_difference", name: "Goal Difference", description: "Correctly predict the goal difference", defaultPoints: 1 },
      { code: "team_goals", name: "Team Goals", description: "Correctly predict the number of goals for one team", defaultPoints: 1 },
    ]);
    console.log("   Scoring rule types inserted\n");
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "test@example.com"))
    .limit(1);

  let testUser;
  if (!existingUser) {
    console.log("  Creating test user...");
    const passwordHash = await bcrypt.hash("password123", 10);
    const [user] = await db
      .insert(users)
      .values({
        username: "testuser",
        email: "test@example.com",
        passwordHash,
        fullName: "Test User",
        avatarUrl: null,
      })
      .returning();
    testUser = user;
    console.log(`   User created: ${user.username} (${user.email})\n`);

    const [playerRole] = await db
      .select()
      .from(catalogUserRoles)
      .where(eq(catalogUserRoles.name, "player"))
      .limit(1);

    if (playerRole) {
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: playerRole.id,
      });
      console.log("   Role 'player' assigned to user\n");
    }
  } else {
    testUser = existingUser;
    console.log(`  User already exists: ${testUser.username}\n`);
  }

  const [existingGroup] = await db
    .select()
    .from(groups)
    .limit(1);

  let testGroup;
  if (!existingGroup) {
    console.log("  Creating test group...");
    const [group] = await db
      .insert(groups)
      .values({
        name: "Grupo Mundial 2026",
        inviteCode: "TEST2026",
        createdById: testUser.id,
        maxMembers: 20,
      })
      .returning();
    testGroup = group;
    console.log(`   Group created: ${group.name} (code: ${group.inviteCode})\n`);

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: testUser.id,
      role: "admin",
    });
    console.log("   User added as group admin\n");

    console.log("  Creating scoring configuration...");
    const ruleTypes = await db.select().from(scoringRuleTypes);

    for (const ruleType of ruleTypes) {
      await db.insert(groupScoringConfig).values({
        groupId: group.id,
        ruleTypeId: ruleType.id,
        points: ruleType.defaultPoints,
        enabled: true,
      });
    }
    console.log("   Scoring config created with defaults\n");
  } else {
    testGroup = existingGroup;
    console.log(`  Group already exists: ${testGroup.name}\n`);
  }

  const [existingMatch] = await db
    .select()
    .from(matches)
    .limit(1);

  if (!existingMatch) {
    console.log("  Creating sample matches...");
    const sampleMatches = [
      { matchNumber: 1, groupName: "A", teamHome: "Qatar", teamAway: "Ecuador", matchDate: new Date("2026-06-11T18:00:00Z") },
      { matchNumber: 2, groupName: "A", teamHome: "Senegal", teamAway: "Netherlands", matchDate: new Date("2026-06-11T21:00:00Z") },
      { matchNumber: 3, groupName: "B", teamHome: "England", teamAway: "Iran", matchDate: new Date("2026-06-12T15:00:00Z") },
      { matchNumber: 4, groupName: "B", teamHome: "USA", teamAway: "Wales", matchDate: new Date("2026-06-12T18:00:00Z") },
      { matchNumber: 5, groupName: "C", teamHome: "Argentina", teamAway: "Saudi Arabia", matchDate: new Date("2026-06-13T12:00:00Z") },
      { matchNumber: 6, groupName: "C", teamHome: "Mexico", teamAway: "Poland", matchDate: new Date("2026-06-13T15:00:00Z") },
      { matchNumber: 7, groupName: "D", teamHome: "France", teamAway: "Australia", matchDate: new Date("2026-06-14T18:00:00Z") },
      { matchNumber: 8, groupName: "D", teamHome: "Denmark", teamAway: "Tunisia", matchDate: new Date("2026-06-14T21:00:00Z") },
      { matchNumber: 9, groupName: "E", teamHome: "Spain", teamAway: "Costa Rica", matchDate: new Date("2026-06-15T15:00:00Z") },
      { matchNumber: 10, groupName: "E", teamHome: "Germany", teamAway: "Japan", matchDate: new Date("2026-06-15T18:00:00Z") },
    ];

    for (const match of sampleMatches) {
      await db.insert(matches).values(match);
    }
    console.log(`   ${sampleMatches.length} matches created\n`);
  }

  console.log(" Seed completed!\n");
  console.log(" Test credentials:");
  console.log("   Email:    test@example.com");
  console.log("   Password: password123\n");
  console.log(" Group:");
  console.log(`   Name: ${testGroup.name}`);
  console.log(`   Code: ${testGroup.inviteCode}\n`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
