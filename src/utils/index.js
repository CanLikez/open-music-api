const mapDBToSongs = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumid,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumid,
});

const mapDBToAlbums = ({
  id,
  name,
  year,
}) => ({
  id,
  name,
  year,
});

module.exports = {
  mapDBToSongs, mapDBToAlbums,
};
