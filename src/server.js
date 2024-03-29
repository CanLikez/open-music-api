/* eslint-disable object-shorthand */
require('dotenv').config();
const Jwt = require('@hapi/jwt');
const Hapi = require('@hapi/hapi');
const path = require('path');
const Inert = require('@hapi/inert');

// api
const albums = require('./api/albums');
const songs = require('./api/songs');

// albums
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// songs
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// error
const clientError = require('./exceptions/ClientError');

// user
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// playlists
const playlists = require('./api/playlists');
const PlaylistService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// activities
const activities = require('./api/activities');
const ActivitiesService = require('./services/postgres/ActivitiesService');
const ActivitiesValidator = require('./validator/activities');

// exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// uploads
const uploads = require('./api/uploads');
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// cache
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  const cacheService = new CacheService();
  const collaborationsService = new CollaborationsService();
  const songsService = new SongsService();
  const albumsService = new AlbumsService(cacheService);
  const authenticationsService = new AuthenticationsService();
  const usersService = new UsersService();
  const playlistsService = new PlaylistService(collaborationsService);
  const activitiesService = new ActivitiesService();
  const storageService = new StorageService(path.resolve(__dirname, 'api/uploads/file/images'));

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('musicapi_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([{
    plugin: albums,
    options: {
      albumService: albumsService,
      songService: songsService,
      albumValidator: AlbumsValidator,
    },
  },
  {
    plugin: users,
    options: {
      userService: usersService,
      userValidator: UsersValidator,
    },
  },
  {
    plugin: songs,
    options: {
      songService: songsService,
      songValidator: SongsValidator,
    },
  },
  {
    plugin: authentications,
    options: {
      authenticationsService,
      usersService,
      tokenManager: TokenManager,
      authenticationValidator: AuthenticationsValidator,
    },
  },
  {
    plugin: collaborations,
    options: {
      collaborationsService,
      playlistsService,
      collaborationValidator: CollaborationsValidator,
    },
  },
  {
    plugin: playlists,
    options: {
      playlistService: playlistsService,
      songService: songsService,
      playlistValidator: PlaylistsValidator,
    },
  },
  {
    plugin: activities,
    options: {
      activityService: activitiesService,
      activityValidator: ActivitiesValidator,
    },
  },
  {
    plugin: _exports,
    options: {
      exportsService: ProducerService,
      playlistService: playlistsService,
      exportsValidator: ExportsValidator,
    },
  },
  {
    plugin: uploads,
    options: {
      uploadsService: storageService,
      albumService: albumsService,
      uploadsValidator: UploadsValidator,
    },
  },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      if (response instanceof clientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      if (!response.isServer) {
        return h.continue;
      }
      console.log(response);
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kesalahan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
