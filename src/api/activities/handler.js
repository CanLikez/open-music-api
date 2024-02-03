class ActivitiesHandler {
  constructor(activityService, activityValidator) {
    this._service = activityService;
    this._validator = activityValidator;
  }

  async getActivitiesByIdHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const activities = await this._service.getSongActivitiesById(playlistId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = ActivitiesHandler;
