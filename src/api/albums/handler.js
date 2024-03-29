class AlbumsHandler {
  constructor(albumService, albumValidator, songService) {
    this._service = albumService;
    this._validator = albumValidator;
    this._songsService = songService;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const albums = request.payload;

    const albumId = await this._service.addAlbum(albums);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._service.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;

    const album = await this._service.getAlbumById(id);
    album.songs = await this._songsService.getSongByAlbumId(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumLikesByIdHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.checkExistedAlbums(albumId);

    await this._service.addAlbumLike(albumId, userId);

    return h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    }).code(201);
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id: albumId } = request.params;
    await this._service.checkExistedAlbums(albumId);
    const { cache, likes } = await this._service.getAlbumLikesById(albumId);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    if (cache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async deleteLikesAlbumByIdhandler(request, h) {
    const { id: albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.checkExistedAlbums(albumId);

    await this._service.deleteAlbumLike(albumId, credentialId);

    return h.response({
      status: 'success',
      message: 'Berhasil membatalkan like',
    }).code(200);
  }
}

module.exports = AlbumsHandler;
