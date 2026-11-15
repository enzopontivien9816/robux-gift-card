# Robux Gift Card

Site de distribution de véritables codes de cartes cadeaux fournis par le propriétaire. Il ne génère pas de Robux ni de codes Roblox.

## Lancer en local

1. `npm install`
2. Définir `ADMIN_PASSWORD` dans l'environnement.
3. `npm start`
4. Ouvrir `http://localhost:3000`

## Déployer sur Render

Créer un Web Service lié à ce dépôt, environnement Node, Build Command `npm install`, Start Command `npm start`. Ajouter une variable secrète `ADMIN_PASSWORD` avec un mot de passe fort.

Pour conserver le stock après redémarrage/redéploiement, ajouter un disque persistant Render monté sur `/var/data` et définir `DATA_DIR=/var/data`. Sans disque persistant, le fichier local de stock peut être perdu lors d'un redéploiement.

## Sécurité

Ne jamais demander le mot de passe Roblox. N'ajouter que des codes authentiques acquis légalement. Le panneau créateur est protégé par `ADMIN_PASSWORD` côté serveur.
