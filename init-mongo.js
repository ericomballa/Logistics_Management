// Initialisation de MongoDB avec les utilisateurs nécessaires
db = db.getSiblingDB('logistics_tracking');

// Créer l'utilisateur pour l'application
db.createUser({
  user: "logistics_user",
  pwd: "logistics_password",
  roles: [
    { role: "readWrite", db: "logistics_tracking" },
    { role: "dbAdmin", db: "logistics_tracking" }
  ]
});

// Afficher les utilisateurs créés
print("Users created in logistics_tracking database:");
db.getUsers().forEach(function(user) {
  printjson(user);
});