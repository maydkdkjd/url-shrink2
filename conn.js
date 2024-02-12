const { MongoClient, ServerApiVersion } = require('mongodb');
const Db = process.env.DB_URI;
const dbName = process.env.DB_NAME || 'url-shrink';

const client = new MongoClient(Db, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

/** @type {import('mongodb').Db} */
var _db;

module.exports = {
  connectToServer: function (callback) {
    client.connect()
      .then(db => {
        if (!db) return;
        _db = db.db(dbName);
        console.log(`Successfully connected to ${dbName}.`);
        _db.collection('urls').createIndex({ 'shortUrl': 1 }, { unique: true })
          .then(() => { console.log(`Successfully created unique index for urls`) })
          .catch(err => { throw err });

        _db.collection('logged_in_users').createIndex({ 'createdAt': 1 }, { expireAfterSeconds: 60 * 60 })
          .then(() => { console.log('Created index for users expiration 60 min.'); })
          .catch(err => { throw err });
      })
      .catch(err => { throw err; });
  },

  getDb: function () {
    return _db;
  },
};
