const jwt = require('jsonwebtoken');
const { db } = require('../data/store');

const publicUser = (u) => {
  if (!u) return u;
  const { password: _password, ...rest } = u;
  return rest;
};

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.users.find((u) => u._id === decoded.id);
    if (!user) {
      req.user = { _id: decoded.id, id: decoded.id, role: decoded.role, email: decoded.email, name: decoded.name };
    } else {
      req.user = publicUser(user);
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role '${req.user.role}' is not authorized for this action` });
  }
  next();
};

module.exports = { protect, authorize, publicUser };
