const jwt = require('jsonwebtoken');
const { db } = require('../data/store');

const publicUser = (u) => {
  if (!u) return u;
  const { password: _password, passwordHash: _passwordHash, resetToken: _resetToken, tokens: _tokens, __v: _v, ...rest } = u;
  return {
    ...rest,
    accountStatus: rest.accountStatus || 'active',
  };
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
      return res.status(401).json({ message: 'User no longer exists or session expired' });
    }
    const status = user.accountStatus || 'active';
    if (status === 'suspended' || status === 'deactivated') {
      return res.status(403).json({
        message: `Account is ${status}${user.statusReason ? `: ${user.statusReason}` : '. Contact an administrator.'}`,
      });
    }
    req.user = publicUser(user);
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
