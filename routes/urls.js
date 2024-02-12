const express = require('express');
const record = express.Router();
const crypto = require('crypto');
const dbo = require('../conn');
const { findUserByToken } = require('../helpers');

record.route('/urls/add').post(function (req, res) {
  const url = req.body.targetUrl;
  const auth = req.cookies.auth;

  findUserByToken(auth, (err, user) => {
    if (err) return res.json(err);
    if (!user) return res.status(401);

    crypto.randomBytes(15, (err, buffer) => {
      if (err) throw err;

      const newUrl = {
        shortUrl: buffer.toString('hex').slice(0, 15),
        url: url,
        uid: user.userId
      };

      dbo.getDb().collection('urls').insertOne({
        ...newUrl,
        lastModified: new Date()
      })
        .then((result) => {
          res.status(200).json(newUrl);
        })
        .catch(err => {
          throw err;
        })
    })
  })

})

record.route('/urls/:id').get((req, res) => {
  const auth = req.cookies.auth;

  findUserByToken(auth, (err, user) => {
    if (err) return res.json(err);
    if (!user) return res.status(401);

    dbo.getDb().collection('urls').find({ uid: req.params.id })
      .sort({ lastModified: -1 })
      .toArray()
      .then(result => {
        res.json(result);
      })
      .catch(err => {
        throw err;
      })
  })
})

record.route('/urls/delete').post((req, res) => {
  const auth = req.cookies.auth;

  findUserByToken(auth, (err, user) => {
    if (err) return res.json(err);
    if (!user) return res.status(401);

    dbo.getDb().collection('urls').deleteOne({
      shortUrl: req.body.shortUrl, uid: user.userId
    }).then((result) => {
      console.log(result);
      res.status(200).json({ success: true });
    }).catch(err => {
      throw err;
    })
  })
})

record.route('/urls/update').post((req, res) => {
  const auth = req.cookies.auth;
  findUserByToken(auth, (err, user) => {
    if (err) return res.json(err);
    if (!user) return res.status(401);

    const query = { shortUrl: req.body.shortUrl, uid: user.userId };
    const update = { url: req.body.url.trim(), lastModified: new Date() };

    dbo.getDb().collection('urls').updateOne(query, { $set: update })
      .then(result => {
        console.log(result);
        res.status(200).json({ success: true });
      })
      .catch(err => {
        throw err;
      })
  })

})

record.route('/u/:id').get((req, res) => {
  dbo.getDb().collection('urls').findOne({
    shortUrl: req.params.id
  }).then(result => {
    if (result) {
      res.redirect(302, result.url);
    } else {
      res.status(404).render('../static/notfound.ejs', { url: req.params.id });
    }
  })
})

module.exports = record;
