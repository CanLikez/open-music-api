const routes = (handler) => [
  {
    method: 'GET',
    path: '/playlists/{id}/activities',
    handler: (request) => handler.getActivitiesByIdHandler(request),
    options: {
      auth: 'musicapi_jwt',
    },
  },
];

module.exports = routes;
