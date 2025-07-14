// Switch to the admin database before running this script in the MongoDB shell
// use admin

db.createUser({
  user: "admin@audioloot.com",
  pwd: "admin123",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    "readWriteAnyDatabase"
  ]
}); 