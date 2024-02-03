const Joi = require('joi');

const PlaylistsPayloadSchema = Joi.object({
  name: Joi.string().max(40).required(),
});

const PlaylistSongPayloadSchema = Joi.object({
  name: Joi.string().max(40).required(),
});

module.exports = { PlaylistsPayloadSchema, PlaylistSongPayloadSchema };
