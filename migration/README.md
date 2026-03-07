mongodump --uri="mongodb+srv://techniquewebdev:0JXingeOrXxBSWNK@technique.ifvpegt.mongodb.net/?retryWrites=true&w=majority&appName=technique" --out /tmp/mongodump
mongorestore --uri="mongodb+srv://techniquewebdev:0JXingeOrXxBSWNK@technique.ifvpegt.mongodb.net/?retryWrites=true&w=majority&appName=technique" --drop --nsFrom="test.*" --nsTo="technique.*" /tmp/mongodump/test

# dump
mongodump --uri="mongodb+srv://techniquewebdev:0JXingeOrXxBSWNK@technique.ifvpegt.mongodb.net/?retryWrites=true&w=majority&appName=technique" --out /tmp/mongodump

# restore into NEW_DB
mongorestore --uri="mongodb+srv://techniquewebdev:0JXingeOrXxBSWNK@technique.ifvpegt.mongodb.net/?retryWrites=true&w=majority&appName=technique" \
  --nsFrom="test.*" --nsTo="technique.*" /tmp/mongodump/test

```sh
// Upload to db:
// ATLAS_URI='mongodb+srv://techniquewebdev:<password>/?retryWrites=true&w=majority&appName=technique' \        
// MONGO_DB_NAME='test' \                            
// node migration/migrate_archive2_new_articles.js --file "migration/Archive 2/normalized-articles.json"
```