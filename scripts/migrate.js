// template/scripts/migrate.js
const { execSync } = require("child_process");

const migrationName = process.argv[2];

if (!migrationName) {
  console.error(
    "❌ Please provide a migration name.\nUsage: npm run migrate your-migration-name"
  );
  process.exit(1);
}

execSync(`npx prisma migrate dev --name ${migrationName}`, {
  stdio: "inherit",
});
