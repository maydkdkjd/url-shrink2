const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getDb } = require('./conn');
const SECRET = process.env.JWT_SECRET;

/** 
 * Insert new user if email doesn't exist
 * @param {Object} user User object
 * @param {Response} res Response to client
 */
const registerNewUser = (user, res) =>
  getDb().collection('users').findOne({ email: user.email })
    .then(result => {
      if (result) return res.status(400).json({ auth: false, message: 'Email exists' });

      bcrypt.hash(user.password, 10).then(hashedPassword => {
        const userDoc = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: hashedPassword,
        }

        getDb().collection('users').insertOne(userDoc)
          .then(result => {
            console.log('New user signed up', result);

            res.status(200).json({
              success: true,
              user: { userId: result.insertedId }
            });
          })
          .catch(err => {
            throw err;
          })
      })
    })

/** 
 * @typedef {function(TypeError, import('mongodb').Document): void} Cb1
 * @callback cb
 */
/** 
 * @param {string} token The token to check
 * @param {Cb1} cb callback
 **/
const findUserByToken = (token, cb) => {
  if (!token) return cb(null, null);
  jwt.verify(token, SECRET, (err, decode) => {
    if (!decode) return cb(null, null);

    getDb().collection('logged_in_users').findOne({
      userId: decode.id, token: token
    })
      .then(user => cb(null, user))
      .catch(err => cb(err));
  })
}

/**
 * Geneerate JWT token and sign in user
 * @param {import('mongodb').Document} user
 * @param {Response} res
 */
const generateToken = (user, res) => {
  const expiresInMin = 60;
  const userId = user._id.toHexString()
  const token = jwt.sign({ id: userId }, SECRET, { expiresIn: 60 * expiresInMin });

  let query = { userId: user._id.toHexString() };
  let newValues = {
    $set: {
      createdAt: new Date(),
      userId: userId,
      token: token
    }
  }

  getDb().collection('logged_in_users').updateOne(query, newValues, { upsert: true })
    .then(result => {
      return res.cookie('auth', token, { maxAge: expiresInMin * 60 * 1000 }).json({
        isAuth: true, id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName
      });
    })
    .catch(err => {
      throw err;
    })
}


module.exports = {
  registerNewUser,
  findUserByToken,
  generateToken
};