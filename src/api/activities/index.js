const ActivitiesHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'activities',
  version: '1.0.0',
  register: async (server, { activityService, activityValidator }) => {
    const activitiesHandler = new ActivitiesHandler(activityService, activityValidator);
    server.route(routes(activitiesHandler));
  },
};
