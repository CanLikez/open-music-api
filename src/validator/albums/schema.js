const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(2024)
    .required(),
});
const AlbumLikesPayloadSchema = Joi.object({
  albumId: Joi.string().max(50).required(),
  userId: Joi.string().max(50).required(),
});
module.exports = { AlbumPayloadSchema, AlbumLikesPayloadSchema };
