const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { albumService, albumValidator, songService }) => {
    const albumsHandler = new AlbumsHandler(albumService, albumValidator, songService);
    server.route(routes(albumsHandler));
  },
};
