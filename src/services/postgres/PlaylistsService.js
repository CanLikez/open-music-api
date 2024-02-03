const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapDBToActivities } = require('../../utils/index');

class PlaylistService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({
    name, owner,
  }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async addPlaylistSongById(playlistId, songId) {
    const id = `playlist-song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT
      playlists.id,
      playlists.name,
      users.username
    FROM playlists
    LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
    LEFT JOIN users ON playlists.owner = users.id
    WHERE playlists.owner = $1 OR collaborations.user_id = $1
    GROUP BY playlists.id, users.username
  `,
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistSongsById(playlistId) {
    const playlistQuery = {
      text: `
          SELECT
            playlists.id as playlist_id,
            playlists.name,
            users.username
          FROM playlists
          LEFT JOIN users ON users.id = playlists.owner
          WHERE playlists.owner = $1
             OR playlists.id IN (
                SELECT playlist_id
                FROM collaborations
                WHERE user_id = $1
             );
        `,
      values: [playlistId],
    };

    const playlistQueryResult = await this._pool.query(playlistQuery);

    const songsQuery = {
      text: `
          SELECT
            playlists.id as playlist_id,
            songs.id as song_id,
            songs.title,
            songs.performer
          FROM playlists
          LEFT JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id
          LEFT JOIN songs ON playlist_songs.song_id = songs.id
          WHERE playlists.id = $1
             OR playlists.id IN (
                SELECT playlist_id
                FROM collaborations
                WHERE user_id = $1
             );
        `,
      values: [playlistId],
    };

    const songsQueryResult = await this._pool.query(songsQuery);

    if (!playlistQueryResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = playlistQueryResult.rows[0];
    const songs = songsQueryResult.rows;

    return {
      playlist: {
        id: playlist.playlist_id,
        name: playlist.name,
        username: playlist.username,
        songs,
      },
    };
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async deletePlaylistSongById(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan.');
    }
  }

  async addSongActivities({
    playlistId, songId, userId, action,
  }) {
    const id = `activities-${nanoid(16)}`;
    const timestamp = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, timestamp],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal membuat aktivitas lagu');
    }
  }

  async getSongActivities(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_activities.action, playlist_activities.time FROM playlist_activities
        LEFT JOIN playlists ON playlist_activities.playlist_id = playlists.id
        LEFT JOIN songs ON playlist_activities.song_id = songs.id
        LEFT JOIN users ON playlist_activities.user_id = users.id
        WHERE playlists.id = $1`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows.map(mapDBToActivities);
  }
}

module.exports = PlaylistService;
