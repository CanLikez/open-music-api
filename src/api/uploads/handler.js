class UploadsHandler {
  constructor(uploadsService, albumService, uploadsValidator) {
    this._service = uploadsService;
    this._validator = uploadsValidator;
    this._albumsService = albumService;
  }

  async postCoverAlbumByIdHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;
    this._validator.validateAlbumCovers(cover.hapi.headers);

    const filename = await this._service.writeFile(cover, cover.hapi, id);

    await this._albumsService.addAlbumCoverById(id, filename);
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;
