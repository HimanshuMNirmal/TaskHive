const mongoose = require('mongoose');
const { AsyncLocalStorage } = require('async_hooks');

const organizationStorage = new AsyncLocalStorage();

const ORGANIZATION_SCOPED_MODELS = [
    'User',
    'Task',
    'Team',
    'ActivityLog',
    'Notification',
    'Setting'
];

const GLOBAL_MODELS = [
    'Organization',
    'Permission',
    'Role'
];

function addOrganizationContext() {
    const addOrganizationFilter = function(query) {
        if (GLOBAL_MODELS.includes(this.model?.modelName)) {
            return;
        }

        if (query.getOptions()?.bypassOrganizationScope) {
            return;
        }

        if (ORGANIZATION_SCOPED_MODELS.includes(this.model?.modelName)) {
            if (!query._conditions.organizationId) {
                const organizationContext = organizationStorage.getStore();
                if (organizationContext) {
                    const organizationId = organizationContext._id || organizationContext;
                    query._conditions.organizationId = organizationId;
                }
            }
        }
    };

    const organizationPlugin = function(schema) {
        schema.pre('find', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('findOne', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('countDocuments', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('exists', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('updateOne', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('updateMany', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('deleteOne', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('deleteMany', function(next) {
            addOrganizationFilter.call(this, this);
            next();
        });

        schema.pre('aggregate', function(next) {
            if (this.options?.bypassOrganizationScope) {
                return next();
            }

            const organizationId = organizationStorage.getStore();
            if (organizationId && ORGANIZATION_SCOPED_MODELS.includes(this.model?.modelName)) {
                this.pipeline.unshift({
                    $match: {
                        organizationId: new mongoose.Types.ObjectId(organizationId)
                    }
                });
            }
            next();
        });

        schema.pre('save', function(next) {
            if (!this.isNew) {
                return next();
            }

            if (!this.organizationId && this.schema.paths.organizationId) {
                const organizationId = organizationStorage.getStore();
                if (organizationId) {
                    this.organizationId = organizationId;
                }
            }
            next();
        });
    };

    ORGANIZATION_SCOPED_MODELS.forEach(modelName => {
        if (mongoose.modelNames().includes(modelName)) {
            const model = mongoose.model(modelName);
            if (!model.schema.plugins.find(p => p.fn === organizationPlugin)) {
                model.schema.plugin(organizationPlugin);
            }
        }
    });
}

function setOrganizationContext(organizationId) {
    const id = organizationId?._id || organizationId;
    return organizationStorage.enterWith(id);
}

function clearOrganizationContext() {
    organizationStorage.disable();
}

function organizationContext(req, res, next) {
    if (req.user?.organizationId) {
        const organizationId = req.user.organizationId._id || req.user.organizationId;
        organizationStorage.run(organizationId, () => {
            next();
        });
    } else {
        next();
    }
}

function bypassOrganizationScope(query) {
    query.setOptions({ bypassOrganizationScope: true });
    return query;
}

module.exports = {
    addOrganizationContext,
    setOrganizationContext,
    clearOrganizationContext,
    organizationContext,
    bypassOrganizationScope
};