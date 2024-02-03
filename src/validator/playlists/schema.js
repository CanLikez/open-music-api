const Joi = require('joi');

const PlaylistsPayloadSchema = Joi.object({
  name: Joi.string().required(),
});

const PlaylistSongPayloadSchema = Joi.object({
  songId: Joi.string().max(60).required(),
});

module.exports = { PlaylistsPayloadSchema, PlaylistSongPayloadSchema };
