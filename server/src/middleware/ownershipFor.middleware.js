const mongoose = require('mongoose');

module.exports = function ownershipFor({ model, idParam = 'id', ownerFields = ['creatorId'] } = {}) {
  if (!model || typeof model.findById !== 'function') {
    throw new Error('ownershipFor: `model` must be a Mongoose model');
  }

  return async function (req, res, next) {
    try {
      const resourceId = req.params[idParam] || req.body.entityId || req.params.entityId;
      if (!resourceId) return next();

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ message: 'Invalid resource id' });
      }

      const resource = await model.findById(resourceId).lean();
      if (!resource) return res.status(404).json({ message: 'Resource not found' });

      req.resource = resource;

      req.isOwner = async () => {
        if (!req.user || !req.user.id) return false;
        const uid = String(req.user.id);
        return ownerFields.some(field => {
          const val = field.includes('.') 
            ? field.split('.').reduce((o, k) => (o ? o[k] : undefined), resource)
            : resource[field];
          return val && String(val) === uid;
        });
      };

      return next();
    } catch (err) {
      return next(err);
    }
  };
};
