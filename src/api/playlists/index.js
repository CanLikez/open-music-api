const PlaylistsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, { playlistService, songService, playlistValidator }) => {
    const playlistsHandler = new PlaylistsHandler(playlistService, songService, playlistValidator);
    server.route(routes(playlistsHandler));
  },
};
