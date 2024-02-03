const { Pool } = require('pg');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class ActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async getSongActivities(id) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_activities.action, playlist_activities.time FROM playlist_activities
        LEFT JOIN playlists ON playlist_activities.playlist_id = playlists.id
        LEFT JOIN songs ON playlist_activities.song_id = songs.id
        LEFT JOIN users ON playlist_activities.user_id = users.id
        WHERE playlists.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows;
  }

  async verifyPlaylistAccess(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const { rows } = await this._pool.query(query);

    if (!rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini.');
    }
  }
}

module.exports = ActivitiesService;
