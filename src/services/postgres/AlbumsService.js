const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const ClientError = require('../../exceptions/ClientError');
const { mapDBToAlbums } = require('../../utils/index');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return result.rows.map(mapDBToAlbums)[0];
  }

  async checkExistedAlbums(id) {
    const query = {
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Id tidak ditemukan.');
    }
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus album. Id tidak ditemukan');
    }
  }

  async addAlbumCoverById(id, coverAlbum) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [coverAlbum, id],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan.');
    }
  }

  async addAlbumLike(albumId, userId) {
    const like = 'like';

    const queryLiked = {
      text: 'SELECT id FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(queryLiked);
    /*
  Agar code menjadi lebih clean, kamu dapat mengekstrak proses query
  untuk melakukan verifikasi eksistensi album like ke fungsi tersendiri,
  lalu kamu dapat memanggilnya di handler sebelum pemanggilan fungsi add album like,
  sehingga fungsi ini hanya melakukan proses query add album like
  sebagaimana representasi nama fungsinya.
    */
    if (result.rowCount) {
      throw new ClientError('Gagal memberikan like');
    } else {
      const id = `like-${nanoid(16)}`;

      const queryAddLike = {
        text: 'INSERT INTO album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };

      await this._pool.query(queryAddLike);
      await this._cacheService.delete(`album_likes:${albumId}`);
    }
    await this._cacheService.delete(`album_likes:${albumId}`);
    return like;
  }

  async deleteAlbumLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };
    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal membatalkan like album');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return {
        likes: parseInt(JSON.parse(result), 10),
        cache: true,
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) FROM album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const { rows } = await this._pool.query(query);
      /*
      Kamu dapat mendestructure nilai rowCount untuk mengakses
      nilai rows affected untuk mengetahui jumlah baris yang dikenai operasi di database.

      contoh:

      const { rows, rowCount } = await this._pool.query(query);

      if (!rowCount) {
      */
      if (!rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(rows[0].count));

      return {
        likes: parseInt(rows[0].count, 10),
        cache: false,
      };
    }
  }
}

module.exports = AlbumsService;
